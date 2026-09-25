from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from .models import (
    EvidenceProcessingStatus,
    FraudReport,
    IntegrationSyncStatus,
    ReportIDCounter,
)


class ReportCreationError(Exception):
    pass


def next_report_id(now=None):
    """Allocate a daily TG-YYYY-NNNNNN identifier under a row lock."""
    day = (now or timezone.localdate())
    with transaction.atomic():
        counter, _ = ReportIDCounter.objects.get_or_create(
            day=day,
            defaults={"last_value": 0},
        )
        counter = ReportIDCounter.objects.select_for_update().get(pk=counter.pk)
        counter.last_value += 1
        counter.save(update_fields=["last_value"])
    return f"TG-{day.year}-{counter.last_value:06d}"


def create_public_report(*, validated_data, idempotency_key=None, evidence=None):
    """Persist a citizen report before any optional downstream synchronization."""
    if idempotency_key:
        existing = FraudReport.objects.filter(idempotency_key=idempotency_key).first()
        if existing:
            return existing, False

    with transaction.atomic():
        report = FraudReport(
            report_id=next_report_id(),
            claim=validated_data["claim"],
            description=validated_data.get("description", ""),
            category=validated_data.get("category", "OTHER"),
            is_anonymous=validated_data.get("is_anonymous", False),
            contact_email=validated_data.get("contact_email", ""),
            contact_phone=validated_data.get("contact_phone", ""),
            idempotency_key=idempotency_key,
        )
        if evidence is not None:
            report.evidence_file_id = evidence.file_id
            report.evidence_name = evidence.name
            report.evidence_content_type = evidence.content_type
            report.evidence_size = evidence.size
            report.evidence_processing_status = EvidenceProcessingStatus.STORED
        else:
            report.evidence_processing_status = EvidenceProcessingStatus.NOT_PROVIDED

        # PostgreSQL is the source of truth. External destinations are marked
        # honestly until their server-side credentials and workers are enabled.
        report.appwrite_sync_status = IntegrationSyncStatus.NOT_CONFIGURED
        report.google_sheets_sync_status = IntegrationSyncStatus.NOT_CONFIGURED
        report.save()
    return report, True
