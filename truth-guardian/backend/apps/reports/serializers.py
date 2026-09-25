from rest_framework import serializers

from .models import EvidenceProcessingStatus, ReportStatus


class FraudReportCreateSerializer(serializers.Serializer):
    claim = serializers.CharField(max_length=10_000)
    description = serializers.CharField(max_length=20_000, required=False, allow_blank=True)
    category = serializers.CharField(max_length=80, required=False, default="OTHER")
    is_anonymous = serializers.BooleanField(required=False, default=False)
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    evidence = serializers.FileField(required=False, allow_null=True)

    def validate_claim(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Enter the claim or suspicious message.")
        return value

    def validate(self, attrs):
        if attrs.get("is_anonymous"):
            # Anonymous reports must not accidentally retain optional contact
            # details in the authoritative report row.
            attrs["contact_email"] = ""
            attrs["contact_phone"] = ""
        return attrs


class FraudReportReceiptSerializer(serializers.Serializer):
    report_id = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    evidence_processing_status = serializers.ChoiceField(
        choices=EvidenceProcessingStatus.choices
    )


class PublicFraudReportSerializer(serializers.Serializer):
    """Safe receipt fields only; contact details and provider IDs stay private."""

    report_id = serializers.CharField(source="report_id")
    status = serializers.ChoiceField(choices=ReportStatus.choices)
    created_at = serializers.DateTimeField()
    evidence_processing_status = serializers.ChoiceField(
        choices=EvidenceProcessingStatus.choices
    )
