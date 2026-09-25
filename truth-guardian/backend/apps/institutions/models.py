from django.db import models


class InstitutionVerificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending verification"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"
    SUSPENDED = "SUSPENDED", "Suspended"


class InstitutionCategory(models.TextChoices):
    GOVERNMENT_MINISTRY = "GOVERNMENT_MINISTRY", "Government ministry"
    GOVERNMENT_DEPARTMENT = "GOVERNMENT_DEPARTMENT", "Government department"
    GOVERNMENT_AGENCY = "GOVERNMENT_AGENCY", "Government agency"
    POLICE = "POLICE", "Police"
    REGULATOR = "REGULATOR", "Regulator"
    PUBLIC_INSTITUTION = "PUBLIC_INSTITUTION", "Public institution"
    LOCAL_GOVERNMENT = "LOCAL_GOVERNMENT", "Local government"
    PUBLIC_HEALTH = "PUBLIC_HEALTH", "Public health"
    EDUCATION = "EDUCATION", "Education"
    FINANCE = "FINANCE", "Finance"
    AGRICULTURE = "AGRICULTURE", "Agriculture"
    TELECOMMUNICATIONS = "TELECOMMUNICATIONS", "Telecommunications"
    PUBLIC_SAFETY = "PUBLIC_SAFETY", "Public safety"
    OTHER = "OTHER", "Other verified organization"


class GovernmentInstitution(models.Model):
    """A manually verified source institution.

    Appwrite owns the account identity. This table is the server-side approval
    record that grants an account permission to submit or review content.
    """

    name = models.CharField(max_length=255)
    acronym = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    official_domain = models.CharField(max_length=255, blank=True)
    official_email_domain = models.CharField(max_length=255, blank=True)
    category = models.CharField(
        max_length=40,
        choices=InstitutionCategory.choices,
        default=InstitutionCategory.OTHER,
    )
    verification_status = models.CharField(
        max_length=20,
        choices=InstitutionVerificationStatus.choices,
        default=InstitutionVerificationStatus.PENDING,
    )
    active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class OfficialRole(models.TextChoices):
    GOVERNMENT_OFFICIAL = "GOVERNMENT_OFFICIAL", "Government official"
    ORGANIZATION_OFFICIAL = "ORGANIZATION_OFFICIAL", "Organization official"
    CONTENT_EDITOR = "CONTENT_EDITOR", "Content editor"
    VERIFICATION_OFFICER = "VERIFICATION_OFFICER", "Verification officer"
    ANALYST = "ANALYST", "Analyst"
    ADMIN = "ADMIN", "Administrator"
    SUPER_ADMIN = "SUPER_ADMIN", "Super administrator"


class OfficialVerificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending verification"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    SUSPENDED = "SUSPENDED", "Suspended"


class OfficialUser(models.Model):
    """Authorization metadata for an Appwrite account.

    There is intentionally no password or Django auth user here. The
    ``appwrite_user_id`` is a non-secret identifier used to join a validated
    Appwrite principal to a manually approved role and institution.
    """

    appwrite_user_id = models.CharField(max_length=128, unique=True)
    email = models.EmailField()
    display_name = models.CharField(max_length=255, blank=True)
    institution = models.ForeignKey(
        GovernmentInstitution,
        on_delete=models.PROTECT,
        related_name="official_users",
        null=True,
        blank=True,
    )
    role = models.CharField(
        max_length=40,
        choices=OfficialRole.choices,
        default=OfficialRole.ANALYST,
    )
    verification_status = models.CharField(
        max_length=20,
        choices=OfficialVerificationStatus.choices,
        default=OfficialVerificationStatus.PENDING,
    )
    approved_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="approved_accounts",
        null=True,
        blank=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["institution__name", "email"]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
