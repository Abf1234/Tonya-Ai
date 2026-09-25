import pytest
from django.urls import reverse
from rest_framework import status

from apps.accounts.authentication import AppwritePrincipal
from apps.documents.models import KnowledgeSource
from apps.institutions.models import OfficialRole
from apps.reports.models import FraudReport


def principal_for(official):
    return AppwritePrincipal(
        id=official.appwrite_user_id,
        name=official.display_name or official.email,
        email=official.email,
    )


@pytest.mark.django_db
def test_non_admin_official_cannot_open_admin_overview(api_client, official):
    api_client.force_authenticate(user=principal_for(official))

    response = api_client.get(reverse("admin-overview"))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_platform_admin_can_record_an_allowlisted_url_without_claiming_scrape(
    api_client, institution
):
    # A platform administrator is intentionally institutionless in this boundary.
    from apps.institutions.models import OfficialUser, OfficialVerificationStatus

    admin = OfficialUser.objects.create(
        appwrite_user_id="platform-admin-knowledge",
        email="platform-admin-knowledge@example.test",
        display_name="Platform Admin",
        institution=None,
        role=OfficialRole.SUPER_ADMIN,
        verification_status=OfficialVerificationStatus.APPROVED,
    )
    api_client.force_authenticate(user=principal_for(admin))

    response = api_client.post(
        reverse("admin-knowledge-sources"),
        {
            "institution_id": institution.id,
            "url": "https://moti.test/public-notice",
            "title": "Public notice source",
            "notes": "Review before enabling a worker.",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["status"] == "PENDING_REVIEW"
    assert response.data["processing_status"] == "NOT_CONFIGURED"
    assert response.data["message"] == "URL recorded for review. No scraper ran."
    source = KnowledgeSource.objects.get()
    assert source.url == "https://moti.test/public-notice"
    assert source.institution_id == institution.id


@pytest.mark.django_db
def test_knowledge_source_rejects_unapproved_domain_and_duplicate_url(
    api_client, institution
):
    from apps.institutions.models import OfficialUser, OfficialVerificationStatus

    admin = OfficialUser.objects.create(
        appwrite_user_id="platform-admin-knowledge-validation",
        email="platform-admin-validation@example.test",
        display_name="Platform Admin",
        institution=None,
        role=OfficialRole.ADMIN,
        verification_status=OfficialVerificationStatus.APPROVED,
    )
    api_client.force_authenticate(user=principal_for(admin))
    url = reverse("admin-knowledge-sources")

    rejected = api_client.post(
        url,
        {"institution_id": institution.id, "url": "https://untrusted.example/notice"},
        format="json",
    )
    assert rejected.status_code == status.HTTP_400_BAD_REQUEST

    accepted = api_client.post(
        url,
        {"institution_id": institution.id, "url": "https://moti.test/notice"},
        format="json",
    )
    assert accepted.status_code == status.HTTP_201_CREATED

    duplicate = api_client.post(
        url,
        {"institution_id": institution.id, "url": "https://moti.test/notice"},
        format="json",
    )
    assert duplicate.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_admin_overview_returns_aggregate_counts_without_report_contact_data(
    api_client, institution
):
    from apps.institutions.models import OfficialUser, OfficialVerificationStatus

    admin = OfficialUser.objects.create(
        appwrite_user_id="platform-admin-overview",
        email="platform-admin-overview@example.test",
        display_name="Platform Admin",
        institution=None,
        role=OfficialRole.SUPER_ADMIN,
        verification_status=OfficialVerificationStatus.APPROVED,
    )
    FraudReport.objects.create(
        report_id="TG-2026-009999",
        claim="A private claim",
        contact_email="private@example.test",
        contact_phone="+232 123 4567",
    )
    api_client.force_authenticate(user=principal_for(admin))

    response = api_client.get(reverse("admin-overview"))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["reports"]["total"] == 1
    assert response.data["institutions"]["verified_count"] == 1
    assert response.data["integrations"]["knowledge_scraper"]["status"] == "not_configured"
    serialized = str(response.data)
    assert "private@example.test" not in serialized
    assert "+232 123 4567" not in serialized
