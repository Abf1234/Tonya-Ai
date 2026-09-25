from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.permissions import official_can_access_institution
from apps.institutions.models import InstitutionVerificationStatus

from .models import (
    ContentExtractionStatus,
    IndexingStatus,
    OfficialDocument,
    OfficialDocumentStatus,
)


def set_submission_defaults(document):
    if document.body_text.strip():
        document.extraction_status = ContentExtractionStatus.MANUAL_TEXT
        document.indexing_status = IndexingStatus.NOT_INDEXED
    elif document.source_url or document.file_reference:
        document.extraction_status = ContentExtractionStatus.PENDING
        document.indexing_status = IndexingStatus.PENDING
    return document


def review_document(*, document, action, reviewer, reason=""):
    """Apply a reviewed state transition without claiming unconfigured AI work."""
    with transaction.atomic():
        document = OfficialDocument.objects.select_for_update().select_related("institution").get(pk=document.pk)
        if not official_can_access_institution(reviewer, document.institution_id):
            raise PermissionDenied("You may only review content within your institution scope.")
        if action == "approve":
            if document.status != OfficialDocumentStatus.PENDING_REVIEW:
                raise ValidationError(
                    {"status": "Only pending documents can be approved. Submit a new version instead."}
                )
            if (
                not document.institution.active
                or document.institution.verification_status != InstitutionVerificationStatus.VERIFIED
            ):
                raise ValidationError(
                    {"institution": "The institution must remain active and verified before approval."}
                )
            if document.expiry_date and document.expiry_date < timezone.localdate():
                raise ValidationError({"expiry_date": "An expired document cannot be approved."})
            if not document.body_text.strip():
                raise ValidationError(
                    {
                        "body_text": (
                            "Approval requires extracted or manually supplied text. "
                            "URL/file extraction is not configured yet."
                        )
                    }
                )
            if document.supersedes_id:
                previous = OfficialDocument.objects.select_for_update().filter(
                    pk=document.supersedes_id,
                    institution_id=document.institution_id,
                ).first()
                if previous:
                    previous.status = OfficialDocumentStatus.SUPERSEDED
                    previous.published = False
                    previous.is_current = False
                    previous.save(update_fields=["status", "published", "is_current", "updated_at"])
            document.status = OfficialDocumentStatus.APPROVED
            document.published = True
            document.is_current = True
            document.approved_by = reviewer
            document.approved_at = timezone.now()
            document.rejection_reason = ""
            document.extraction_status = ContentExtractionStatus.AVAILABLE
            document.indexing_status = IndexingStatus.NOT_INDEXED
            document.save()
        elif action == "reject":
            if not reason.strip():
                raise ValidationError({"reason": "A rejection reason is required."})
            document.status = OfficialDocumentStatus.REJECTED
            document.published = False
            document.is_current = False
            document.rejection_reason = reason.strip()
            document.save()
        elif action == "archive":
            document.status = OfficialDocumentStatus.ARCHIVED
            document.published = False
            document.is_current = False
            document.save()
        elif action == "expire":
            document.status = OfficialDocumentStatus.EXPIRED
            document.published = False
            document.is_current = False
            document.expiry_date = document.expiry_date or timezone.localdate()
            document.save()
        else:
            raise ValidationError({"action": "Unsupported document action."})
    return document
