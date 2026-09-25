from django.contrib import admin

from .models import FraudReport, ReportIDCounter


@admin.register(FraudReport)
class FraudReportAdmin(admin.ModelAdmin):
    list_display = (
        "report_id",
        "category",
        "status",
        "is_anonymous",
        "evidence_processing_status",
        "google_sheets_sync_status",
        "created_at",
    )
    list_filter = ("status", "category", "is_anonymous", "google_sheets_sync_status")
    search_fields = ("report_id", "claim", "description")
    readonly_fields = (
        "report_id",
        "created_at",
        "updated_at",
        "evidence_file_id",
        "appwrite_document_id",
    )


@admin.register(ReportIDCounter)
class ReportIDCounterAdmin(admin.ModelAdmin):
    list_display = ("day", "last_value")
    readonly_fields = ("day", "last_value")
