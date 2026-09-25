from django.urls import path

from .views import PublicAssistantView

urlpatterns = [
    path("assistant/", PublicAssistantView.as_view(), name="public-assistant"),
    path("fact-checks/", PublicAssistantView.as_view(), name="public-fact-check"),
]
