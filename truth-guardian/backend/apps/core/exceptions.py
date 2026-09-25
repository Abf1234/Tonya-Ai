"""Stable, non-sensitive API error envelopes.

Provider payloads, database errors and authentication internals are never
forwarded to the browser. Validation errors keep their field mapping so the
client can show a per-field message.
"""

import logging

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

DEFAULT_ERROR_MESSAGE = "The request could not be completed."


def error_response(code, message, *, response_status, details=None):
    """Build the shared error envelope used by handlers and manual responses."""
    error = {"code": str(code), "message": str(message)}
    if details is not None:
        error["details"] = details
    return Response({"error": error}, status=response_status)


def api_exception_handler(exc, context):
    """Return stable API error envelopes for handled and unhandled failures."""
    response = exception_handler(exc, context)
    if response is None:
        # Let Django surface the technical traceback while developing.
        if getattr(settings, "DEBUG", False):
            return None
        logger.exception("Unhandled API exception", exc_info=exc)
        return error_response(
            "server_error",
            "The service could not complete the request. Please try again.",
            response_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data
    code = _safe_code(exc)
    response.data = {
        "error": {
            "code": code,
            "message": _safe_message(detail),
            "details": detail,
        }
    }
    return response


def _safe_code(exc):
    """Expose a stable machine-readable code for the documented envelope."""
    if isinstance(exc, ValidationError):
        return "validation_error"
    return str(getattr(exc, "default_code", "api_error"))


def _safe_message(detail):
    if isinstance(detail, dict) and detail.get("detail"):
        return str(detail["detail"])
    return DEFAULT_ERROR_MESSAGE
