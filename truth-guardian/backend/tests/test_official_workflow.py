from datetime import date, timedelta

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import force_authenticate

from apps.accounts.authentication import AppwritePrincipal
from apps.documents.models import OfficialDocument, OfficialDocumentStatus
from apps.institutions.models import OfficialRole, OfficialUser


@pytest.mark.django_db
def test_privileged_document_endpoint_rejects_anonymous_request(api_client):
    response = api_client.get(reverse("official-documents"))

    assert response.status_code in {
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    }


@pytest.mark.django_db
def test_approved_official_can_submit_manual_content(authed_client, institution, official):
    response = authed_client.post(
        reverse("official-documents"),
        {
            "title": "Official public notice",
            "description": "A reviewed notice",
            "body_text": "The official notice contains the full announcement text.",
            "category": "Public notice",
            "document_type": "PUBLIC_NOTICE",
            "source_url": "https://moti.test/notice",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    document = OfficialDocument.objects.get()
    assert document.submitted_by == official
    assert document.status == OfficialDocumentStatus.PENDING_REVIEW
    assert document.published is False


@pytest.mark.django_db
def test_official_url_must_be_https_and_on_verified_domain(authed_client, official):
    response = authed_client.post(
        reverse("official-documents"),
        {
            "title": "Untrusted URL",
            "category": "Other",
            "source_url": "https://example.org/not-an-official-source",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "source_url" in response.data["error"]["details"]


@pytest.mark.django_db
def test_reviewer_can_approve_manual_content_and_public_page_can_read_it(
    api_client, institution, official, reviewer
):
    document = OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="Reviewable notice",
        body_text="This is the approved text.",
        category="Public notice",
        status=OfficialDocumentStatus.PENDING_REVIEW,
    )
    reviewer_principal = AppwritePrincipal(
        id=reviewer.appwrite_user_id,
        name=reviewer.display_name,
        email=reviewer.email,
    )
    api_client.force_authenticate(user=reviewer_principal)

    response = api_client.post(
        reverse("official-document-review", args=[document.id]),
        {"action": "approve"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    document.refresh_from_db()
    assert document.status == OfficialDocumentStatus.APPROVED
    assert document.published is True
    assert document.approved_by == reviewer

    public_response = api_client.post(
        reverse("public-assistant"),
        {"query": "Reviewable"},
        format="json",
    )
    assert public_response.data["status"] == "evidence_found"


@pytest.mark.django_db
def test_approved_official_can_read_scoped_portal_metrics(authed_client, official):
    official.role = OfficialRole.GOVERNMENT_OFFICIAL
    official.save(update_fields=["role"])

    response = authed_client.get(reverse("official-dashboard"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["permissions"]["can_review"] is False


@pytest.mark.django_db
def test_url_only_submission_cannot_be_approved_before_extraction(
    api_client, institution, official, reviewer
):
    document = OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="URL-only notice",
        category="Public notice",
        source_url="https://moti.test/notice",
        status=OfficialDocumentStatus.PENDING_REVIEW,
    )
    reviewer_principal = AppwritePrincipal(
        id=reviewer.appwrite_user_id,
        name=reviewer.display_name,
        email=reviewer.email,
    )
    api_client.force_authenticate(user=reviewer_principal)

    response = api_client.post(
        reverse("official-document-review", args=[document.id]),
        {"action": "approve"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    document.refresh_from_db()
    assert document.status == OfficialDocumentStatus.PENDING_REVIEW
