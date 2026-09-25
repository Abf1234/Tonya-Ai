from unittest.mock import Mock, patch

import pytest
from django.db import OperationalError
from django.test import override_settings
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
def test_api_root_returns_foundation_contract(api_client):
    response = api_client.get(reverse("api-root"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["service"] == "Truth Guardian Sierra Leone API"
    assert response.data["status"] == "public-slice"
    assert response.data["endpoints"]["liveness"].endswith("/api/health/")
    assert response.data["endpoints"]["readiness"].endswith("/api/health/ready/")


@pytest.mark.django_db
def test_liveness_does_not_require_database_content(api_client):
    response = api_client.get(reverse("health-liveness"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "status": "ok",
        "service": "truth-guardian-api",
    }
    assert response["Cache-Control"] == "no-store"


@pytest.mark.django_db
def test_readiness_checks_database(api_client):
    response = api_client.get(reverse("health-readiness"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "status": "ready",
        "checks": {"database": "available"},
    }


@pytest.mark.django_db
@patch(
    "apps.core.views.connection.cursor",
    new=Mock(side_effect=OperationalError("private database detail")),
)
def test_readiness_does_not_expose_database_errors(api_client):
    response = api_client.get(reverse("health-readiness"))

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.data == {
        "status": "unavailable",
        "checks": {"database": "unavailable"},
    }
    assert "private database detail" not in response.content.decode()


@pytest.mark.django_db
@override_settings(CORS_ALLOWED_ORIGINS=["http://localhost:5173"])
def test_cors_preflight_is_limited_to_configured_frontend(api_client):
    response = api_client.options(
        reverse("health-liveness"),
        HTTP_ORIGIN="http://localhost:5173",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response["Access-Control-Allow-Origin"] == "http://localhost:5173"
