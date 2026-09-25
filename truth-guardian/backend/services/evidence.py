"""Server-side evidence validation and guarded Appwrite Storage integration."""

from __future__ import annotations

import hashlib
import importlib
import logging
import os
import re
from dataclasses import dataclass

from appwrite.client import Client
from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.services.storage import Storage
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StoredEvidence:
    file_id: str
    name: str
    content_type: str
    size: int
    sha256: str


class EvidenceUnavailable(Exception):
    """Raised when evidence cannot be safely accepted in the current phase."""

    code = "evidence_upload_unavailable"


def safe_evidence_name(name):
    """Return a bounded, path-free filename for private object storage."""
    candidate = os.path.basename(str(name or "")).strip()
    candidate = re.sub(r"[^A-Za-z0-9._-]+", "_", candidate).strip("._")
    return (candidate or "evidence")[:255]


def validate_evidence(uploaded_file):
    if uploaded_file is None:
        return None
    if not getattr(uploaded_file, "name", "") or not getattr(uploaded_file, "size", 0):
        raise ValidationError("The evidence file is empty.")
    if uploaded_file.size > settings.EVIDENCE_MAX_UPLOAD_BYTES:
        raise ValidationError("The evidence file exceeds the configured size limit.")
    if uploaded_file.content_type not in settings.EVIDENCE_ALLOWED_CONTENT_TYPES:
        raise ValidationError("This evidence file type is not allowed.")

    # Basic signature checks reject files whose extension and content disagree
    # before any external scanner or storage call is made.
    uploaded_file.seek(0)
    header = uploaded_file.read(16)
    uploaded_file.seek(0)
    content_type = uploaded_file.content_type
    valid_signature = {
        "application/pdf": header.startswith(b"%PDF-"),
        "image/png": header.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/jpeg": header.startswith(b"\xff\xd8\xff"),
        "image/webp": header.startswith(b"RIFF") and header[8:12] == b"WEBP",
    }.get(content_type, False)
    if not valid_signature:
        raise ValidationError("The evidence file content does not match its declared type.")
    return uploaded_file


def _run_scanner(uploaded_file):
    if not settings.EVIDENCE_SCANNING_ENABLED:
        raise EvidenceUnavailable("Evidence scanning is not configured.")
    if not settings.EVIDENCE_SCANNER:
        raise EvidenceUnavailable("Evidence scanning is not configured.")

    try:
        module_path, function_name = settings.EVIDENCE_SCANNER.rsplit(".", 1)
        scanner = getattr(importlib.import_module(module_path), function_name)
        result = scanner(uploaded_file)
    except (ImportError, AttributeError, ValueError) as exc:
        logger.error("Evidence scanner configuration is invalid")
        raise EvidenceUnavailable("Evidence scanning is unavailable.") from exc
    except Exception as exc:  # scanner is an external boundary
        logger.exception("Evidence scanner failed")
        raise EvidenceUnavailable("Evidence scanning is unavailable.") from exc
    finally:
        uploaded_file.seek(0)

    if result not in (True, {"safe": True}):
        raise EvidenceUnavailable("The evidence file has not passed safety scanning.")
    uploaded_file.seek(0)


def store_evidence(uploaded_file):
    """Validate, scan, and store a file privately through Appwrite Storage.

    There is intentionally no browser-to-Appwrite upload path. Callers receive
    a typed unavailable error until the server key, private bucket, and real
    scanner are all configured; no placeholder file ID is ever generated.
    """
    validate_evidence(uploaded_file)
    if uploaded_file is None:
        return None

    _run_scanner(uploaded_file)

    if not settings.APPWRITE_ENDPOINT or not settings.APPWRITE_PROJECT_ID:
        raise EvidenceUnavailable("Private evidence storage is not configured.")
    if not settings.APPWRITE_STORAGE_BUCKET_ID or not settings.APPWRITE_SERVER_API_KEY:
        raise EvidenceUnavailable("Private evidence storage is not configured.")

    uploaded_file.seek(0)
    content = uploaded_file.read()
    uploaded_file.seek(0)
    if len(content) > settings.EVIDENCE_MAX_UPLOAD_BYTES:
        raise ValidationError("The evidence file exceeds the configured size limit.")
    safe_name = safe_evidence_name(uploaded_file.name)
    digest = hashlib.sha256(content).hexdigest()

    try:
        client = (
            Client()
            .set_endpoint(settings.APPWRITE_ENDPOINT)
            .set_project(settings.APPWRITE_PROJECT_ID)
            .set_key(settings.APPWRITE_SERVER_API_KEY)
        )
        result = Storage(client).create_file(
            settings.APPWRITE_STORAGE_BUCKET_ID,
            ID.unique(),
            InputFile.from_bytes(
                content,
                filename=safe_name,
                mime_type=uploaded_file.content_type,
            ),
        )
    except AppwriteException as exc:
        logger.error("Appwrite evidence storage failed")
        raise EvidenceUnavailable("Private evidence storage is unavailable.") from exc
    except OSError as exc:
        logger.error("Evidence upload could not be read")
        raise EvidenceUnavailable("Evidence processing is unavailable.") from exc

    file_id = getattr(result, "$id", None) or getattr(result, "id", None)
    if not isinstance(file_id, str) or not file_id:
        raise EvidenceUnavailable("Private evidence storage returned an invalid file reference.")

    return StoredEvidence(
        file_id=file_id,
        name=safe_name,
        content_type=uploaded_file.content_type,
        size=len(content),
        sha256=digest,
    )
