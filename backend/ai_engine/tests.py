from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from .services import _call_llm


class OpenRouterLLMTests(SimpleTestCase):
    @override_settings(
        AI_PROVIDER="openrouter",
        OPENROUTER_API_KEY="test-openrouter-key",
        OPENROUTER_MODEL="liquid/lfm-2.5-2.6b:free",
        GEMINI_API_KEY="",
        OPENAI_API_KEY="",
    )
    def test_call_llm_uses_openrouter_model(self):
        with patch("openai.OpenAI") as mock_openai:
            mock_client = mock_openai.return_value
            mock_client.chat.completions.create.return_value = SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content="ok"))]
            )

            response = _call_llm("hello")

            self.assertEqual(response, "ok")
            self.assertEqual(mock_openai.call_args.kwargs["api_key"], "test-openrouter-key")
            self.assertEqual(mock_openai.call_args.kwargs["base_url"], "https://openrouter.ai/api/v1")
            self.assertEqual(
                mock_client.chat.completions.create.call_args.kwargs["model"],
                "liquid/lfm-2.5-2.6b:free",
            )
