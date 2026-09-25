from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import force_authenticate

from apps.accounts.authentication import AppwritePrincipal
from apps.documents.models import OfficialDocument, OfficialDocumentStatus
from apps.institutions.models import (
    GovernmentInstitution,
    InstitutionCategory,
    InstitutionVerificationStatus,
    OfficialRole,
    OfficialUser,
    OfficialVerificationStatus,
)


def principal_for(official):
    return AppwritePrincipal(
        id=official.appwrite_user_id,
        name=official.display_name or official.email,
        email=official.email,
    )


def make_institution(name, domain):
    return GovernmentInstitution.objects.create(
        name=name,
        category=InstitutionCategory.GOVERNMENT_DEPARTMENT,
        verification_status=InstitutionVerificationStatus.VERIFIED,
        official_domain=domain,
        active=True,
    )


def make_official(*, appwrite_id, email, institution, role=OfficialRole.GOVERNMENT_OFFICIAL):
    return OfficialUser.objects.create(
        appwrite_user_id=appwrite_id,
        email=email,
        display_name=email,
        institution=institution,
        role=role,
        verification_status=OfficialVerificationStatus.APPROVED,
    )


@pytest.mark.django_db
def test_institutionless_non_admin_cannot_access_official_portal(api_client, principal):
    make_official(
        appwrite_id=principal.appwrite_id,
        email=principal.email,
        institution=None,
    )
    api_client.force_authenticate(user=principal)

    response = api_client.get(reverse("official-documents"))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_official_with_unverified_institution_is_not_authorized(api_client, principal, institution):
    institution.active = False
    institution.save(update_fields=["active", "updated_at"])
    make_official(
        appwrite_id=principal.appwrite_id,
        email=principal.email,
        institution=institution,
    )
    api_client.force_authenticate(user=principal)

    response = api_client.get(reverse("official-documents"))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_reviewer_cannot_review_a_document_from_another_institution(api_client, institution, official, reviewer):
    other_institution = make_institution("Other Verified Ministry", "other.test")
    other_submitter = make_official(
        appwrite_id="other-submitter",
        email="other-submitter@example.test",
        institution=other_institution,
    )
    document = OfficialDocument.objects.create(
        institution=other_institution,
        submitted_by=other_submitter,
        title="Other institution notice",
        body_text="This must remain outside the reviewer's scope.",
        category="Public notice",
        status=OfficialDocumentStatus.PENDING_REVIEW,
    )
    api_client.force_authenticate(user=principal_for(reviewer))

    response = api_client.post(
        reverse("official-document-review", args=[document.id]),
        {"action": "approve"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    document.refresh_from_db()
    assert document.status == OfficialDocumentStatus.PENDING_REVIEW


@pytest.mark.django_db
def test_reviewer_list_contains_the_institution_queue_but_not_other_institutions(
    api_client, institution, official, reviewer
):
    same_institution_submitter = make_official(
        appwrite_id="same-institution-submitter",
        email="same-institution@example.test",
        institution=institution,
    )
    first = OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="First queue item",
        body_text="First item text",
        category="Public notice",
    )
    second = OfficialDocument.objects.create(
        institution=institution,
        submitted_by=same_institution_submitter,
        title="Second queue item",
        body_text="Second item text",
        category="Public notice",
    )
    other_institution = make_institution("Unrelated Ministry", "unrelated.test")
    other_submitter = make_official(
        appwrite_id="unrelated-submitter",
        email="unrelated@example.test",
        institution=other_institution,
    )
    unrelated = OfficialDocument.objects.create(
        institution=other_institution,
        submitted_by=other_submitter,
        title="Unrelated item",
        body_text="Unrelated item text",
        category="Public notice",
    )
    api_client.force_authenticate(user=principal_for(reviewer))

    response = api_client.get(reverse("official-documents"))

    assert response.status_code == status.HTTP_200_OK
    ids = {document["id"] for document in response.data["results"]}
    assert {first.id, second.id}.issubset(ids)
    assert unrelated.id not in ids


@pytest.mark.django_db
def test_expired_document_cannot_be_approved(api_client, institution, official, reviewer):
    document = OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="Expired notice",
        body_text="This text is present but the document is expired.",
        category="Public notice",
        expiry_date=timezone.localdate() - timedelta(days=1),
        status=OfficialDocumentStatus.PENDING_REVIEW,
    )
    api_client.force_authenticate(user=principal_for(reviewer))

    response = api_client.post(
        reverse("official-document-review", args=[document.id]),
        {"action": "approve"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    document.refresh_from_db()
    assert document.status == OfficialDocumentStatus.PENDING_REVIEW


@pytest.mark.django_db
def test_rejection_requires_a_reason_and_persists_a_supplied_reason(
    api_client, institution, official, reviewer
):
    document = OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="Notice needing revision",
        body_text="Draft text",
        category="Public notice",
    )
    api_client.force_authenticate(user=principal_for(reviewer))
    url = reverse("official-document-review", args=[document.id])

    missing_reason = api_client.post(url, {"action": "reject"}, format="json")
    assert missing_reason.status_code == status.HTTP_400_BAD_REQUEST
    document.refresh_from_db()
    assert document.status == OfficialDocumentStatus.PENDING_REVIEW

    response = api_client.post(
        url,
        {"action": "reject", "reason": "Add the issuing officer and publication date."},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK
    document.refresh_from_db()
    assert document.status == OfficialDocumentStatus.REJECTED
    assert "issuing officer" in document.rejection_reason


@pytest.mark.django_db
def test_platform_admin_without_institution_can_review_a_verified_document(
    api_client, institution, official
):
    admin = make_official(
        appwrite_id="platform-admin",
        email="platform-admin@example.test",
        institution=None,
        role=OfficialRole.SUPER_ADMIN,
    )
    document = OfficialDocument.objects.create(
        institution=institution,
        submitted_by=official,
        title="Administrator review",
        body_text="The text is ready for authorized review.",
        category="Public notice",
    )
    api_client.force_authenticate(user=principal_for(admin))

    response = api_client.post(
        reverse("official-document-review", args=[document.id]),
        {"action": "approve"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    document.refresh_from_db()
    assert document.status == OfficialDocumentStatus.APPROVED


@pytest.mark.django_db
def test_public_information_count_reflects_all_matches_while_results_are_capped(
    api_client, institution, official
):
    today = timezone.localdate()
    for index in range(101):
        OfficialDocument.objects.create(
            institution=institution,
            submitted_by=official,
            title=f"Approved notice {index}",
            body_text=f"Official text {index}",
            category="Public notice",
            status=OfficialDocumentStatus.APPROVED,
            published=True,
            is_current=True,
            effective_date=today,
        )

    response = api_client.get(reverse("public-verified-information-list"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 101
    assert len(response.data["results"]) == 100
