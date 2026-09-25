from django.db import OperationalError, connection
from django.urls import reverse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

API_VERSION = "0.2.0"


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response(
        {
            "service": "Truth Guardian Sierra Leone API",
            "version": API_VERSION,
            "status": "public-slice",
            "documentation": "/docs/API.md",
            "endpoints": {
                "liveness": reverse("health-liveness"),
                "readiness": reverse("health-readiness"),
                "public_fraud_reports": reverse("public-fraud-report-create"),
                "public_verified_information": reverse("public-verified-information-list"),
                "public_assistant": reverse("public-assistant"),
                "public_fact_check": reverse("public-fact-check"),
                "official_documents": reverse("official-documents"),
                "official_dashboard": reverse("official-dashboard"),
            },
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def liveness(request):
    response = Response({"status": "ok", "service": "truth-guardian-api"})
    response["Cache-Control"] = "no-store"
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def readiness(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except OperationalError:
        return Response(
            {
                "status": "unavailable",
                "checks": {"database": "unavailable"},
            },
            status=503,
        )

    response = Response(
        {
            "status": "ready",
            "checks": {"database": "available"},
        }
    )
    response["Cache-Control"] = "no-store"
    return response
