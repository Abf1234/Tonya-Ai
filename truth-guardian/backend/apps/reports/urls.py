from django.urls import path

from .views import PublicFraudReportCreateView

urlpatterns = [
    path("reports/", PublicFraudReportCreateView.as_view(), name="public-fraud-report-create"),
]
