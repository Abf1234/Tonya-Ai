from urllib.parse import urlparse

from rest_framework import serializers

from apps.institutions.models import (
    InstitutionVerificationStatus,
    OfficialRole,
)

from .models import (
    KnowledgeSource,
    OfficialDocument,
    OfficialDocumentStatus,
    OfficialDocumentType,
)


def validate_official_source_url(value, institution, field_name="source_url"):
    """Validate a URL against the institution's server-side domain allowlist."""
    url = (value or "").strip()
    if not url:
        return ""

    parsed = urlparse(url)
    try:
        port = parsed.port
    except ValueError as exc:
        raise serializers.ValidationError({field_name: "The URL has an invalid port."}) from exc
    if (
        parsed.scheme.lower() != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or port not in (None, 443)
    ):
        raise serializers.ValidationError(
            {field_name: "Official URLs must use HTTPS without embedded credentials."}
        )

    official_domain = institution.official_domain.strip().lower().lstrip(".")
    if not official_domain:
        raise serializers.ValidationError(
            {field_name: "This institution has no approved official domain yet."}
        )
    hostname = parsed.hostname.lower().rstrip(".")
    if hostname != official_domain and not hostname.endswith(f".{official_domain}"):
        raise serializers.ValidationError(
            {field_name: "The URL is not on the institution's approved domain."}
        )
    return url


class OfficialDocumentSubmissionSerializer(serializers.Serializer):
    institution_id = serializers.IntegerField(required=False)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    body_text = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(max_length=100)
    document_type = serializers.ChoiceField(
        choices=OfficialDocumentType.choices,
        default=OfficialDocumentType.OTHER,
    )
    source_url = serializers.URLField(max_length=1000, required=False, allow_blank=True)
    publication_date = serializers.DateField(required=False, allow_null=True)
    effective_date = serializers.DateField(required=False, allow_null=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    supersedes_id = serializers.IntegerField(required=False, allow_null=True)
    evidence = serializers.FileField(required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context["request"]
        official = getattr(request, "official_user", None)
        if official is None:
            raise serializers.ValidationError("An approved official account is required.")

        institution_id = attrs.get("institution_id")
        if institution_id is None:
            institution = official.institution
        else:
            from apps.institutions.models import GovernmentInstitution

            institution = GovernmentInstitution.objects.filter(pk=institution_id).first()

        if institution is None:
            raise serializers.ValidationError({"institution_id": "An institution is required."})
        if not institution.active or institution.verification_status != InstitutionVerificationStatus.VERIFIED:
            raise serializers.ValidationError({"institution_id": "The institution is not verified and active."})
        if official.role not in {OfficialRole.ADMIN, OfficialRole.SUPER_ADMIN} and institution.pk != official.institution_id:
            raise serializers.ValidationError(
                {"institution_id": "You may submit content only for your assigned institution."}
            )

        source_url = validate_official_source_url(
            attrs.get("source_url", ""),
            institution,
        )
        attrs["source_url"] = source_url

        supersedes_id = attrs.get("supersedes_id")
        if supersedes_id:
            previous = OfficialDocument.objects.filter(
                pk=supersedes_id,
                institution=institution,
            ).first()
            if previous is None:
                raise serializers.ValidationError({"supersedes_id": "The previous version was not found."})
            attrs["supersedes"] = previous
        else:
            attrs["supersedes"] = None

        if not attrs.get("body_text", "").strip() and not source_url and not attrs.get("evidence"):
            raise serializers.ValidationError(
                "Provide official text, an approved source URL, or a supporting file."
            )
        attrs["institution"] = institution
        return attrs


class OfficialDocumentSubmissionResponseSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    submitted_by_email = serializers.EmailField(source="submitted_by.email", read_only=True)

    class Meta:
        model = OfficialDocument
        fields = [
            "id",
            "title",
            "description",
            "category",
            "document_type",
            "source_url",
            "publication_date",
            "effective_date",
            "expiry_date",
            "version_number",
            "status",
            "published",
            "institution_name",
            "submitted_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PublicOfficialDocumentSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    institution_acronym = serializers.CharField(
        source="institution.acronym", read_only=True
    )
    verification_status = serializers.SerializerMethodField()

    class Meta:
        model = OfficialDocument
        fields = [
            "id",
            "title",
            "description",
            "institution_name",
            "institution_acronym",
            "category",
            "document_type",
            "source_url",
            "publication_date",
            "effective_date",
            "expiry_date",
            "version_number",
            "verification_status",
        ]

    def get_verification_status(self, obj):
        return "approved_official"


class ReviewDecisionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=("approve", "reject", "archive", "expire"))
    reason = serializers.CharField(required=False, allow_blank=True, max_length=4000)


class KnowledgeSourceCreateSerializer(serializers.Serializer):
    institution_id = serializers.IntegerField()
    url = serializers.URLField(max_length=1000)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=4000, required=False, allow_blank=True)

    def validate(self, attrs):
        from apps.institutions.models import GovernmentInstitution

        institution = GovernmentInstitution.objects.filter(pk=attrs["institution_id"]).first()
        if institution is None:
            raise serializers.ValidationError({"institution_id": "An institution is required."})
        if not institution.active or institution.verification_status != InstitutionVerificationStatus.VERIFIED:
            raise serializers.ValidationError(
                {"institution_id": "The institution is not verified and active."}
            )

        url = validate_official_source_url(attrs["url"], institution, field_name="url")
        if KnowledgeSource.objects.filter(institution=institution, url=url).exists():
            raise serializers.ValidationError({"url": "This URL is already registered for the institution."})
        attrs["url"] = url
        attrs["institution"] = institution
        return attrs


class KnowledgeSourceSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    submitted_by_email = serializers.EmailField(source="submitted_by.email", read_only=True)

    class Meta:
        model = KnowledgeSource
        fields = [
            "id",
            "institution",
            "institution_name",
            "url",
            "title",
            "notes",
            "status",
            "processing_status",
            "active",
            "last_error_code",
            "last_attempt_at",
            "last_success_at",
            "submitted_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
