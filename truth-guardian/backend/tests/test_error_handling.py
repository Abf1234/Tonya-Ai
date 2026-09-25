import pytest
from django.test import override_settings
from rest_framework.exceptions import ValidationError

from apps.core.exceptions import api_exception_handler, error_response


def test_error_response_uses_the_shared_envelope():
    response = error_response(
        "example_code",
        "Example message.",
        response_status=409,
        details={"field": "value"},
    )

    assert response.status_code == 409
    assert response.data == {
        "error": {
            "code": "example_code",
            "message": "Example message.",
            "details": {"field": "value"},
        }
    }


def test_validation_errors_keep_field_details_without_internal_text():
    response = api_exception_handler(
        ValidationError({"url": ["This field is required."]}),
        {"view": None},
    )

    assert response.status_code == 400
    assert response.data["error"]["code"] == "validation_error"
    assert response.data["error"]["message"] == "The request could not be completed."
    assert response.data["error"]["details"]["url"] == ["This field is required."]


@override_settings(DEBUG=False)
def test_unhandled_failures_return_a_safe_internal_error_envelope():
    response = api_exception_handler(RuntimeError("secret database detail"), {"view": None})

    assert response.status_code == 500
    assert response.data == {
        "error": {
            "code": "server_error",
            "message": "The service could not complete the request. Please try again.",
        }
    }
    assert "secret database detail" not in str(response.data)


@override_settings(DEBUG=True)
def test_unhandled_failures_still_surface_while_debugging():
    assert api_exception_handler(RuntimeError("boom"), {"view": None}) is None


@pytest.mark.django_db
def test_duplicate_knowledge_source_uses_the_shared_error_envelope(
    api_client, platform_admin, platform_admin_principal
):
    from django.urls import reverse

    from apps.documents.models import KnowledgeSource

    api_client.force_authenticate(user=platform_admin_principal)
    payload = {"institution_id": platform_admin.institution.id, "url": "https://moti.test/dup"}
    first = api_client.post(reverse("admin-knowledge-sources"), payload, format="json")
    assert first.status_code == 201
    assert KnowledgeSource.objects.count() == 1

    response = api_client.post(reverse("admin-knowledge-sources"), payload, format="json")

    assert response.status_code == 400
    assert response.data["error"]["code"] == "validation_error"
    assert response.data["error"]["details"]["url"] == [
        "This URL is already registered for the institution."
    ]
    assert KnowledgeSource.objects.count() == 1
