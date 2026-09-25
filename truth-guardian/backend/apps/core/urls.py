from django.urls import path

from . import views

urlpatterns = [
    path("", views.api_root, name="api-root"),
    path("health/", views.liveness, name="health-liveness"),
    path("health/ready/", views.readiness, name="health-readiness"),
]
