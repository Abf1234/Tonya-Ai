from django.db import models

from apps.institutions.models import GovernmentInstitution, OfficialUser


class OfficialDocumentStatus(models.TextChoices):
    PENDING_REVIEW = "PENDING_REVIEW", "Pending review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"
    ARCHIVED = "ARCHIVED", "Archived"
    SUPERSEDED = "SUPERSEDED", "Superseded"


class OfficialDocumentType(models.TextChoices):
    ANNOUNCEMENT = "ANNOUNCEMENT", "Announcement"
    PRESS_RELEASE = "PRESS_RELEASE", "Press release"
    CIRCULAR = "CIRCULAR", "Circular"
    POLICY = "POLICY", "Policy or regulation"
    PUBLIC_NOTICE = "PUBLIC_NOTICE", "Public notice"
    FAQ = "FAQ", "Frequently asked question"
    REPORT = "REPORT", "Report"
    OFFICIAL_STATEMENT = "OFFICIAL_STATEMENT", "Official statement"
    OTHER = "OTHER", "Other official material"


class ContentExtractionStatus(models.TextChoices):
    NOT_STARTED = "NOT_STARTED", "Not started"
    MANUAL_TEXT = "MANUAL_TEXT", "Manual text supplied"
    PENDING = "PENDING", "Extraction pending"
    AVAILABLE = "AVAILABLE", "Text available"
    FAILED = "FAILED", "Extraction failed"


class IndexingStatus(models.TextChoices):
    NOT_INDEXED = "NOT_INDEXED", "Not indexed"
    PENDING = "PENDING", "Indexing pending"
    READY = "READY", "Ready for retrieval"
    FAILED = "FAILED", "Indexing failed"


class KnowledgeSourceStatus(models.TextChoices):
    PENDING_REVIEW = "PENDING_REVIEW", "Pending review"
    QUEUED = "QUEUED", "Queued for extraction"
    PROCESSING = "PROCESSING", "Extraction in progress"
    COMPLETED = "COMPLETED", "Extraction completed"
    FAILED = "FAILED", "Extraction failed"
    REJECTED = "REJECTED", "Rejected"
    DISABLED = "DISABLED", "Disabled"


class KnowledgeSourceProcessingStatus(models.TextChoices):
    NOT_CONFIGURED = "NOT_CONFIGURED", "No extraction worker configured"
    PENDING = "PENDING", "Pending extraction"
    RUNNING = "RUNNING", "Extraction in progress"
    COMPLETED = "COMPLETED", "Extraction completed"
    FAILED = "FAILED", "Extraction failed"


class OfficialDocument(models.Model):
    """An official content item kept separate from citizen fraud reports.

    A document is public only after an authorized reviewer approves it. The
    current implementation deliberately does not fetch URLs, extract files, or
    call an AI/indexing provider without explicit server-side configuration.
    """

    institution = models.ForeignKey(
        GovernmentInstitution,
        on_delete=models.PROTECT,
        related_name="official_documents",
    )
    submitted_by = models.ForeignKey(
        OfficialUser,
        on_delete=models.PROTECT,
        related_name="submitted_documents",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    body_text = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    document_type = models.CharField(
        max_length=40,
        choices=OfficialDocumentType.choices,
        default=OfficialDocumentType.OTHER,
    )
    source_url = models.URLField(max_length=1000, blank=True)
    file_reference = models.CharField(max_length=255, blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_content_type = models.CharField(max_length=120, blank=True)
    file_size = models.PositiveBigIntegerField(null=True, blank=True)
    publication_date = models.DateField(null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    version_number = models.PositiveIntegerField(default=1)
    supersedes = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="superseded_by",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=30,
        choices=OfficialDocumentStatus.choices,
        default=OfficialDocumentStatus.PENDING_REVIEW,
    )
    published = models.BooleanField(default=False)
    is_current = models.BooleanField(default=True)
    extraction_status = models.CharField(
        max_length=30,
        choices=ContentExtractionStatus.choices,
        default=ContentExtractionStatus.NOT_STARTED,
    )
    indexing_status = models.CharField(
        max_length=30,
        choices=IndexingStatus.choices,
        default=IndexingStatus.NOT_INDEXED,
    )
    source_priority = models.PositiveSmallIntegerField(default=100)
    rejection_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        OfficialUser,
        on_delete=models.SET_NULL,
        related_name="approved_documents",
        null=True,
        blank=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-publication_date", "-created_at"]
        indexes = [
            models.Index(fields=["status", "published", "is_current"]),
            models.Index(fields=["institution", "status"]),
        ]

    def __str__(self):
        return self.title


class KnowledgeSource(models.Model):
    """An administrator-approved URL awaiting a real extraction worker.

    Creating a link only records intent. It does not fetch the URL, extract
    text, index content, or claim that a scraper ran. Those transitions must be
    performed by a separately configured and audited worker.
    """

    institution = models.ForeignKey(
        GovernmentInstitution,
        on_delete=models.PROTECT,
        related_name="knowledge_sources",
    )
    submitted_by = models.ForeignKey(
        OfficialUser,
        on_delete=models.PROTECT,
        related_name="knowledge_sources",
    )
    url = models.URLField(max_length=1000)
    title = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=KnowledgeSourceStatus.choices,
        default=KnowledgeSourceStatus.PENDING_REVIEW,
    )
    processing_status = models.CharField(
        max_length=30,
        choices=KnowledgeSourceProcessingStatus.choices,
        default=KnowledgeSourceProcessingStatus.NOT_CONFIGURED,
    )
    active = models.BooleanField(default=True)
    last_error_code = models.CharField(max_length=80, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "url"],
                name="documents_knowledge_source_institution_url_uniq",
            )
        ]
        indexes = [
            models.Index(fields=["status", "processing_status"]),
            models.Index(fields=["institution", "created_at"]),
        ]

    def __str__(self):
        return self.title or self.url
