from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework import status

from apps.assistant.ai import build_messages, generate_grounded_answer


def _response(payload, response_status=200):
    return SimpleNamespace(
        status_code=response_status,
        json=lambda: payload,
    )


def _enable_provider(monkeypatch):
    monkeypatch.setattr(settings, "HUGGINGFACE_ENABLED", True)
    monkeypatch.setattr(settings, "HUGGINGFACE_TOKEN", "server-only-test-token")
    monkeypatch.setattr(settings, "HUGGINGFACE_API_URL", "https://router.huggingface.co/v1/chat/completions")
    monkeypatch.setattr(settings, "HUGGINGFACE_MODEL", "test/model:fastest")
    monkeypatch.setattr(settings, "HUGGINGFACE_TIMEOUT_SECONDS", 2)
    monkeypatch.setattr(settings, "HUGGINGFACE_MAX_TOKENS", 200)


def test_huggingface_is_disabled_by_default_without_network(monkeypatch):
    monkeypatch.setattr(settings, "HUGGINGFACE_ENABLED", False)
    post = Mock()
    monkeypatch.setattr("apps.assistant.ai.requests.post", post)

    assert generate_grounded_answer(query="Hello", evidence=[]) is None
    post.assert_not_called()


def test_krio_prompt_redacts_contact_details_and_limits_unapproved_urls(monkeypatch):
    _enable_provider(monkeypatch)
    post = Mock(
        return_value=_response(
            {
                "choices": [
                    {
                        "message": {
                            "content": "Krio test [S1] https://evil.example/fake"
                        }
                    }
                ]
            }
        )
    )
    monkeypatch.setattr("apps.assistant.ai.requests.post", post)
    evidence = [
        {
            "title": "Approved notice",
            "excerpt": "Official text",
            "source_url": "https://moti.test/notice",
        }
    ]

    result = generate_grounded_answer(
        query="Please explain this for me at person@example.test or +232 123 4567",
        evidence=evidence,
        language="krio",
    )

    assert result is not None
    assert result.text == "Krio test [S1] [link omitted]"
    payload = post.call_args.kwargs["json"]
    prompt = payload["messages"][1]["content"]
    assert "[contact email removed]" in prompt
    assert "[phone number removed]" in prompt
    assert "person@example.test" not in prompt
    assert "+232 123 4567" not in prompt
    assert "Krio" in payload["messages"][0]["content"]


def test_provider_failure_returns_unavailable_without_exposing_error(monkeypatch):
    _enable_provider(monkeypatch)
    post = Mock(
        return_value=_response({"error": "secret provider detail"}, response_status=503)
    )
    monkeypatch.setattr("apps.assistant.ai.requests.post", post)

    result = generate_grounded_answer(
        query="A claim",
        evidence=[{"title": "Approved", "excerpt": "Text", "source_url": "https://moti.test/notice"}],
    )

    assert result is not None
    assert result.text == ""
    assert result.status == "unavailable"


def test_no_evidence_never_calls_the_optional_provider(monkeypatch):
    _enable_provider(monkeypatch)
    post = Mock()
    monkeypatch.setattr("apps.assistant.ai.requests.post", post)

    assert generate_grounded_answer(query="A claim", evidence=[]) is None
    post.assert_not_called()


def test_language_is_validated_by_public_endpoint(api_client):
    response = api_client.post(
        reverse("public-assistant"),
        {"query": "Is this notice current?", "language": "not-a-language"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
