from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.assistant.urls")),
]
