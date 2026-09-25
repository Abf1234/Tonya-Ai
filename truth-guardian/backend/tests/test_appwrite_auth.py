from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from django.test import override_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from apps.accounts.authentication import AppwriteJWTAuthentication, AppwritePrincipal


def bearer_request(token="short-lived-token"):
    request = APIRequestFactory().get("/api/protected/", HTTP_AUTHORIZATION=f"Bearer {token}")
    return request


@override_settings(APPWRITE_ENDPOINT="https://example.test/v1", APPWRITE_PROJECT_ID="project-1")
def test_appwrite_jwt_authentication_returns_a_minimal_principal():
    client = Mock()
    client.set_endpoint.return_value = client
    client.set_project.return_value = client
    client.set_jwt.return_value = client
    account = Mock()
    # The Python SDK returns a User model here, not a raw dictionary.
    account.get.return_value = SimpleNamespace(
        id="user-1",
        name="Example User",
        email="user@example.test",
        labels=["PUBLIC_USER"],
        status=True,
        password="must-not-be-retained",
    )

    with patch("apps.accounts.authentication.Client", return_value=client), patch(
        "apps.accounts.authentication.Account", return_value=account
    ):
        principal, auth = AppwriteJWTAuthentication().authenticate(bearer_request())

    assert isinstance(principal, AppwritePrincipal)
    assert principal.id == "user-1"
    assert principal.email == "user@example.test"
    assert principal.labels == ("PUBLIC_USER",)
    assert principal.appwrite_id == "user-1"
    assert principal.is_authenticated is True
    assert principal.is_staff is False
    assert auth is None
    client.set_endpoint.assert_called_once_with("https://example.test/v1")
    client.set_project.assert_called_once_with("project-1")
    client.set_jwt.assert_called_once_with("short-lived-token")


@override_settings(APPWRITE_ENDPOINT="", APPWRITE_PROJECT_ID="project-1")
def test_appwrite_jwt_authentication_rejects_configuration_gaps():
    with pytest.raises(AuthenticationFailed, match="not configured"):
        AppwriteJWTAuthentication().authenticate(bearer_request())


@override_settings(APPWRITE_ENDPOINT="https://example.test/v1", APPWRITE_PROJECT_ID="project-1")
def test_appwrite_jwt_authentication_rejects_malformed_account_payloads():
    client = Mock()
    client.set_endpoint.return_value = client
    client.set_project.return_value = client
    client.set_jwt.return_value = client
    account = Mock()
    account.get.return_value = {"$id": "user-1"}

    with patch("apps.accounts.authentication.Client", return_value=client), patch(
        "apps.accounts.authentication.Account", return_value=account
    ):
        with pytest.raises(AuthenticationFailed, match="invalid account response"):
            AppwriteJWTAuthentication().authenticate(bearer_request())


@override_settings(APPWRITE_ENDPOINT="https://example.test/v1", APPWRITE_PROJECT_ID="project-1")
def test_appwrite_jwt_authentication_rejects_disabled_accounts():
    client = Mock()
    client.set_endpoint.return_value = client
    client.set_project.return_value = client
    client.set_jwt.return_value = client
    account = Mock()
    account.get.return_value = SimpleNamespace(
        id="user-1",
        name="Example User",
        email="user@example.test",
        labels=[],
        status=False,
    )

    with patch("apps.accounts.authentication.Client", return_value=client), patch(
        "apps.accounts.authentication.Account", return_value=account
    ):
        with pytest.raises(AuthenticationFailed, match="disabled"):
            AppwriteJWTAuthentication().authenticate(bearer_request())
