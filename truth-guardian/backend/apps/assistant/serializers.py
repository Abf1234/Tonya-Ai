from rest_framework import serializers

from .ai import SUPPORTED_LANGUAGES


class PublicAssistantQuerySerializer(serializers.Serializer):
    query = serializers.CharField(max_length=4000, required=False, allow_blank=True)
    claim = serializers.CharField(max_length=4000, required=False, allow_blank=True)
    url = serializers.URLField(max_length=2000, required=False, allow_blank=True)
    language = serializers.ChoiceField(
        choices=SUPPORTED_LANGUAGES,
        required=False,
        default="auto",
    )

    def validate(self, attrs):
        query = (attrs.get("query") or attrs.get("claim") or attrs.get("url") or "").strip()
        if not query:
            raise serializers.ValidationError("Enter a question, claim, or URL to check.")
        attrs["query"] = query
        attrs["language"] = attrs.get("language", "auto")
        return attrs
