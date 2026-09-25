from django.db import IntegrityError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import error_response
from services.evidence import EvidenceUnavailable, store_evidence

from .models import FraudReport
from .serializers import FraudReportCreateSerializer, FraudReportReceiptSerializer
from .services import create_public_report


class PublicFraudReportCreateView(APIView):
    """Create a PostgreSQL-first citizen report without requiring an account."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FraudReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idempotency_key = request.headers.get("Idempotency-Key", "").strip() or None
        if idempotency_key and (len(idempotency_key) > 128 or not all(
            character.isalnum() or character in "-_:." for character in idempotency_key
        )):
            return error_response(
                "invalid_idempotency_key",
                "The Idempotency-Key header is invalid.",
                response_status=status.HTTP_400_BAD_REQUEST,
            )

        # A replay must not attempt to scan or upload the same evidence again.
        # Return the original receipt before crossing the storage boundary.
        if idempotency_key:
            existing_report = self._existing_report(idempotency_key)
            if existing_report is not None:
                return self._receipt_response(existing_report, created=False)

        uploaded_file = serializer.validated_data.get("evidence")
        try:
            evidence = store_evidence(uploaded_file) if uploaded_file else None
            report, created = create_public_report(
                validated_data=serializer.validated_data,
                idempotency_key=idempotency_key,
                evidence=evidence,
            )
        except EvidenceUnavailable as exc:
            return error_response(
                exc.code,
                str(exc),
                response_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except IntegrityError:
            # A concurrent replay of the same idempotency key can arrive before
            # the first transaction commits. Re-read rather than creating a
            # duplicate report or exposing database details.
            if not idempotency_key:
                raise
            report = self._existing_report(idempotency_key)
            if report is None:
                raise
            created = False

        return self._receipt_response(report, created=created)

    @staticmethod
    def _receipt_response(report, *, created):
        body = FraudReportReceiptSerializer(report).data
        body["message"] = (
            "Your report was received. Keep this reference for follow-up."
            if created
            else "This idempotent submission was already received; the original reference is shown."
        )
        return Response(
            body,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @staticmethod
    def _existing_report(key):
        return FraudReport.objects.filter(idempotency_key=key).first()
