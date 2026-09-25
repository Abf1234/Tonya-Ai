from django.db import models


class ReportStatus(models.TextChoices):
    RECEIVED = "RECEIVED", "Received"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    ACTION_TAKEN = "ACTION_TAKEN", "Action taken"
    CLOSED = "CLOSED", "Closed"


class EvidenceProcessingStatus(models.TextChoices):
    NOT_PROVIDED = "NOT_PROVIDED", "No evidence provided"
    PENDING = "PENDING", "Evidence pending"
    STORED = "STORED", "Evidence stored privately"
    REJECTED = "REJECTED", "Evidence rejected"
    FAILED = "FAILED", "Evidence processing failed"


class IntegrationSyncStatus(models.TextChoices):
    NOT_CONFIGURED = "NOT_CONFIGURED", "Not configured"
    PENDING = "PENDING", "Pending synchronization"
    SYNCED = "SYNCED", "Synchronized"
    FAILED = "FAILED", "Synchronization failed"


class ReportIDCounter(models.Model):
    day = models.DateField(unique=True)
    last_value = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.day}: {self.last_value}"


class FraudReport(models.Model):
    """A citizen-originated report, never an authoritative knowledge item."""

    report_id = models.CharField(max_length=32, unique=True)
    claim = models.TextField()
    description = models.TextField(blank=True)
    category = models.CharField(max_length=80, default="OTHER")
    is_anonymous = models.BooleanField(default=False)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    idempotency_key = models.CharField(max_length=128, null=True, blank=True, unique=True)
    evidence_file_id = models.CharField(max_length=255, blank=True)
    evidence_name = models.CharField(max_length=255, blank=True)
    evidence_content_type = models.CharField(max_length=120, blank=True)
    evidence_size = models.PositiveBigIntegerField(null=True, blank=True)
    evidence_processing_status = models.CharField(
        max_length=30,
        choices=EvidenceProcessingStatus.choices,
        default=EvidenceProcessingStatus.NOT_PROVIDED,
    )
    status = models.CharField(
        max_length=30,
        choices=ReportStatus.choices,
        default=ReportStatus.RECEIVED,
    )
    appwrite_sync_status = models.CharField(
        max_length=30,
        choices=IntegrationSyncStatus.choices,
        default=IntegrationSyncStatus.NOT_CONFIGURED,
    )
    google_sheets_sync_status = models.CharField(
        max_length=30,
        choices=IntegrationSyncStatus.choices,
        default=IntegrationSyncStatus.NOT_CONFIGURED,
    )
    appwrite_document_id = models.CharField(max_length=255, blank=True)
    submitted_channel = models.CharField(max_length=40, default="public_web")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["category", "created_at"]),
        ]

    def __str__(self):
        return self.report_id
