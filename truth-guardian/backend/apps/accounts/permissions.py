from django.db.models import Q
from rest_framework.permissions import BasePermission

from apps.institutions.models import (
    InstitutionVerificationStatus,
    OfficialRole,
    OfficialUser,
    OfficialVerificationStatus,
)


REVIEW_ROLES = frozenset(
    {
        OfficialRole.VERIFICATION_OFFICER,
        OfficialRole.ADMIN,
        OfficialRole.SUPER_ADMIN,
    }
)
ADMIN_ROLES = frozenset({OfficialRole.ADMIN, OfficialRole.SUPER_ADMIN})


def get_verified_official(request):
    """Return the approved DB authorization record for the current principal.

    Appwrite labels are not treated as proof of an official role. A valid
    Appwrite principal must also have an explicitly approved server-side
    record, which keeps account self-assertion from granting privileges.
    """
    principal = getattr(request, "user", None)
    appwrite_id = getattr(principal, "appwrite_id", None)
    if not appwrite_id:
        return None

    return (
        OfficialUser.objects.select_related("institution")
        .filter(
            appwrite_user_id=appwrite_id,
            verification_status=OfficialVerificationStatus.APPROVED,
        )
        .filter(
            # Platform administrators may not belong to an institution;
            # every non-administrator role must be attached to an active,
            # explicitly verified institution.
            Q(role__in=ADMIN_ROLES, institution_id__isnull=True)
            | Q(
                institution__active=True,
                institution__verification_status=InstitutionVerificationStatus.VERIFIED,
            )
        )
        .first()
    )


def official_can_access_institution(official, institution_id):
    """Return whether an approved official may act within an institution scope."""
    return official.role in ADMIN_ROLES or official.institution_id == institution_id


class IsVerifiedOfficial(BasePermission):
    message = "An approved official account is required."

    def has_permission(self, request, view):
        official = get_verified_official(request)
        if official is None:
            return False
        request.official_user = official
        return True


class CanReviewOfficialContent(BasePermission):
    message = "An approved verification officer or administrator is required."

    def has_permission(self, request, view):
        official = get_verified_official(request)
        if official is None or official.role not in REVIEW_ROLES:
            return False
        request.official_user = official
        return True


class IsPlatformAdmin(BasePermission):
    message = "An approved administrator account is required."

    def has_permission(self, request, view):
        official = get_verified_official(request)
        if official is None or official.role not in ADMIN_ROLES:
            return False
        request.official_user = official
        return True
