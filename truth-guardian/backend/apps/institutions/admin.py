from django.contrib import admin

from .models import GovernmentInstitution, OfficialUser


@admin.register(GovernmentInstitution)
class GovernmentInstitutionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "acronym",
        "category",
        "verification_status",
        "active",
    )
    list_filter = ("category", "verification_status", "active")
    search_fields = ("name", "acronym", "official_domain", "official_email_domain")


@admin.register(OfficialUser)
class OfficialUserAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "display_name",
        "institution",
        "role",
        "verification_status",
    )
    list_filter = ("role", "verification_status")
    search_fields = ("email", "display_name", "appwrite_user_id", "institution__name")
    readonly_fields = ("created_at", "updated_at")
