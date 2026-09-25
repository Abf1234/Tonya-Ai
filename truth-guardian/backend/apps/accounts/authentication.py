from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import requests
from appwrite.client import Client
from appwrite.exception import AppwriteException
from appwrite.services.account import Account
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed


def _read_field(payload: Any, *names: str) -> Any:
    if isinstance(payload, Mapping):
        for name in names:
            if name in payload:
                return payload[name]
        return None

    for name in names:
        if hasattr(payload, name):
            return getattr(payload, name)
    return None


@dataclass(frozen=True)
class AppwritePrincipal:
    """Minimal request principal backed by an Appwrite account response.

    Appwrite remains the identity source. This object intentionally contains only
    fields needed by the API and never retains Appwrite's password, hash, session,
    or arbitrary user-preference data.
    """

    id: str
    name: str
    email: str
    labels: tuple[str, ...] = ()
    is_authenticated: bool = True
    is_anonymous: bool = False
    is_active: bool = True
    is_staff: bool = False
    is_superuser: bool = False

    @property
    def username(self) -> str:
        return self.email

    @property
    def appwrite_id(self) -> str:
        return self.id

    @classmethod
    def from_appwrite_user(cls, payload: Any) -> "AppwritePrincipal":
        # The Python SDK returns a User model for Account.get(), while tests and
        # older SDK configurations may return a mapping. Read only the fields we
        # explicitly allow; do not serialize the full model (it includes hashes).
        user_id = _read_field(payload, "$id", "id")
        email = _read_field(payload, "email")
        status = _read_field(payload, "status")
        if not isinstance(user_id, str) or not user_id or not isinstance(email, str) or not email:
            raise AuthenticationFailed("Appwrite returned an invalid account response.")
        if status is not None and status is not True:
            raise AuthenticationFailed("This Appwrite account is disabled or invalid.")

        raw_labels = _read_field(payload, "labels")
        labels = (
            tuple(label for label in raw_labels if isinstance(label, str))
            if isinstance(raw_labels, (list, tuple, set))
            else ()
        )

        return cls(
            id=user_id,
            name=str(_read_field(payload, "name") or ""),
            email=email,
            labels=labels,
        )


class AppwriteJWTAuthentication(BaseAuthentication):
    """Validate a short-lived Appwrite client JWT for protected API requests.

    The browser creates a JWT with ``account.createJWT()`` and sends it as a
    Bearer token. No Django user, password, or session is created.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header:
            return None
        if len(header) != 2 or header[0].lower() != self.keyword.lower().encode():
            return None

        try:
            token = header[1].decode("ascii")
        except UnicodeDecodeError as exc:
            raise AuthenticationFailed("Invalid Appwrite bearer token.") from exc

        if not settings.APPWRITE_ENDPOINT or not settings.APPWRITE_PROJECT_ID:
            raise AuthenticationFailed("Appwrite authentication is not configured.")

        try:
            client = (
                Client()
                .set_endpoint(settings.APPWRITE_ENDPOINT)
                .set_project(settings.APPWRITE_PROJECT_ID)
                .set_jwt(token)
            )
            payload = Account(client).get()
        except AppwriteException as exc:
            if exc.code in {401, 403} or exc.type == "general_unauthorized":
                raise AuthenticationFailed("Invalid or expired Appwrite session.") from exc
            raise AuthenticationFailed("Appwrite authentication service unavailable.") from exc
        except requests.RequestException as exc:
            raise AuthenticationFailed("Appwrite authentication service unavailable.") from exc

        if payload is None:
            raise AuthenticationFailed("Appwrite returned an invalid account response.")

        # Do not return the bearer token as DRF's request.auth. Keeping it out
        # of the request object avoids accidental logging or serialization.
        return AppwritePrincipal.from_appwrite_user(payload), None

    def authenticate_header(self, request) -> str:
        return self.keyword
