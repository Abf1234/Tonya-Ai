from datetime import date, timedelta
from types import SimpleNamespace

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import force_authenticate

from apps.accounts.authentication import AppwritePrincipal
from apps.assistant.services import answer_from_approved_sources
from apps.documents.models import OfficialDocument, OfficialDocumentStatus
from apps.institutions.models import OfficialRole
from apps.reports.models import FraudReport


@pytest.mark.django_db
def test_public_report_persists_and_returns_reference_without_login(api_client):
    response = api_client.post(
        reverse("public-fraud-report-create"),
        {
            "claim": "A message promises an immediate government payment.",
            "description": "It asks for a verification fee.",
            "category": "FRAUD",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["report_id"].startswith("TG-")
    assert response.data["status"] == "RECEIVED"
    assert FraudReport.objects.get().claim.startswith("A message")
    assert "contact" not in response.data


@pytest.mark.django_db
def test_anonymous_report_does_not_retain_optional_contact_details(api_client):
    response = api_client.post(
        reverse("public-fraud-report-create"),
        {
            "claim": "Suspicious message",
            "is_anonymous": True,
            "contact_email": "should-not-be-retained@example.test",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    report = FraudReport.objects.get()
    assert report.is_anonymous is True
    assert report.contact_email == ""


@pytest.mark.django_db
def test_report_idempotency_replays_original_reference(api_client):
    payload = {"claim": "Same suspicious message"}
    headers = {"HTTP_IDEMPOTENCY_KEY": "browser-submission-1"}

    first = api_client.post(reverse("public-fraud-report-create"), payload, format="json", **headers)
    second = api_client.post(reverse("public-fraud-report-create"), payload, format="json", **headers)

    assert first.status_code == status.HTTP_201_CREATED
    assert second.status_code == status.HTTP_200_OK
    assert second.data["report_id"] == first.data["report_id"]
    assert FraudReport.objects.count() == 1


@pytest.mark.django_db
def test_evidence_upload_fails_closed_until_scanner_and_storage_are_configured(api_client):
    # The header is a valid PNG signature; the request must still fail closed
    # because no real malware scanner/server storage is configured.
    evidence = SimpleUploadedFile(
        "screenshot.png",
        b"\x89PNG\r\n\x1a\n" + b"not-a-real-image",
        content_type="image/png",
    )
    response = api_client.post(
        reverse("public-fraud-report-create"),
        {"claim": "Screenshot evidence", "evidence": evidence},
        format="multipart",
    )

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.data["error"]["code"] == "evidence_upload_unavailable"
    assert FraudReport.objects.count() == 0


@pytest.mark.django_db
def test_public_assistant_does_not_invent_a_source_when_registry_is_empty(api_client):
    response = api_client.post(
        reverse("public-assistant"),
        {"query": "Is an unknown scholarship message real?"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "not_verified"
    assert response.data["evidence"] == []
    assert response.data["ai_generated"] is False


@pytest.mark.django_db
def test_public_verified_information_is_empty_until_approved(api_client, institution, official):
    OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="Pending announcement",
        body_text="This must not be public before review.",
        category="Education",
        status=OfficialDocumentStatus.PENDING_REVIEW,
    )

    response = api_client.get(reverse("public-verified-information-list"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 0


@pytest.mark.django_db
def test_approved_current_official_document_is_public_and_cited(
    api_client, institution, official
):
    OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="Approved scholarship notice",
        body_text="Applications open on the official portal.",
        category="Education",
        source_url="https://moti.test/scholarship",
        status=OfficialDocumentStatus.APPROVED,
        published=True,
        is_current=True,
    )

    list_response = api_client.get(reverse("public-verified-information-list"))
    assistant_response = api_client.post(
        reverse("public-assistant"),
        {"query": "scholarship"},
        format="json",
    )

    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.data["count"] == 1
    assert list_response.data["results"][0]["verification_status"] == "approved_official"
    assert assistant_response.data["status"] == "evidence_found"
    assert assistant_response.data["evidence"][0]["source_url"] == "https://moti.test/scholarship"
