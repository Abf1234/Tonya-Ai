from django.contrib import admin

from .models import KnowledgeSource, OfficialDocument


@admin.register(OfficialDocument)
class OfficialDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "institution",
        "status",
        "published",
        "is_current",
        "version_number",
        "created_at",
    )
    list_filter = ("status", "published", "is_current", "document_type")
    search_fields = ("title", "description", "body_text", "institution__name")
    readonly_fields = ("created_at", "updated_at", "approved_at")


@admin.register(KnowledgeSource)
class KnowledgeSourceAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "url",
        "institution",
        "status",
        "processing_status",
        "active",
        "created_at",
    )
    list_filter = ("status", "processing_status", "active", "institution")
    search_fields = ("title", "url", "notes", "institution__name")
    readonly_fields = (
        "status",
        "processing_status",
        "last_error_code",
        "last_attempt_at",
        "last_success_at",
        "created_at",
        "updated_at",
    )
