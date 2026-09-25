import pytest
from rest_framework.test import APIClient

from apps.accounts.authentication import AppwritePrincipal
from apps.institutions.models import (
    GovernmentInstitution,
    InstitutionCategory,
    InstitutionVerificationStatus,
    OfficialRole,
    OfficialUser,
    OfficialVerificationStatus,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def principal():
    return AppwritePrincipal(
        id="appwrite-user-1",
        name="Approved Official",
        email="official@example.test",
        labels=(),
    )


@pytest.fixture
def authed_client(api_client, principal):
    api_client.force_authenticate(user=principal)
    return api_client


@pytest.fixture
def institution(db):
    return GovernmentInstitution.objects.create(
        name="Ministry of Test Information",
        acronym="MTI",
        category=InstitutionCategory.GOVERNMENT_MINISTRY,
        verification_status=InstitutionVerificationStatus.VERIFIED,
        official_domain="moti.test",
        active=True,
    )


@pytest.fixture
def official(institution, principal):
    return OfficialUser.objects.create(
        appwrite_user_id=principal.appwrite_id,
        email=principal.email,
        display_name=principal.name,
        institution=institution,
        role=OfficialRole.VERIFICATION_OFFICER,
        verification_status=OfficialVerificationStatus.APPROVED,
    )


@pytest.fixture
def reviewer(institution):
    return OfficialUser.objects.create(
        appwrite_user_id="reviewer-1",
        email="reviewer@example.test",
        display_name="Reviewer",
        institution=institution,
        role=OfficialRole.VERIFICATION_OFFICER,
        verification_status=OfficialVerificationStatus.APPROVED,
    )


@pytest.fixture
def platform_admin(institution):
    """A platform administrator attached to the test institution.

    `IsPlatformAdmin` accepts institutionless administrators as well; tests that
    depend on that boundary create their own record.
    """
    return OfficialUser.objects.create(
        appwrite_user_id="platform-admin-1",
        email="platform-admin@example.test",
        display_name="Platform Admin",
        institution=institution,
        role=OfficialRole.SUPER_ADMIN,
        verification_status=OfficialVerificationStatus.APPROVED,
    )


@pytest.fixture
def platform_admin_principal(platform_admin):
    return AppwritePrincipal(
        id=platform_admin.appwrite_user_id,
        name=platform_admin.display_name,
        email=platform_admin.email,
        labels=(),
    )
