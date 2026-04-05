from openai import OpenAI

from app.core.config import get_settings


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.openai_api_key) if self.settings.openai_api_key else None

    @property
    def enabled(self) -> bool:
        return self.client is not None

    def chat(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        if not self.client:
            return (
                "AI chat is running in fallback mode. Add OPENAI_API_KEY in backend/.env "
                "to enable live assistant responses."
            )

        response = self.client.responses.create(
            model=self.settings.openai_model,
            input=[
                {"role": "system", "content": system_prompt},
                *messages,
            ],
        )
        return response.output_text.strip()

    def generate_match_insights(
        self,
        current_profile: dict,
        preferences: dict | None,
        candidate: dict,
        score: int,
    ) -> list[str]:
        if not self.client:
            return []

        response = self.client.responses.create(
            model=self.settings.openai_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You explain matrimonial compatibility in a concise, user-friendly way. "
                        "Return exactly three short bullet-free sentences."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Current profile: {current_profile}\n"
                        f"Partner preferences: {preferences}\n"
                        f"Candidate profile: {candidate}\n"
                        f"Compatibility score: {score}\n"
                        "Return exactly three short insights."
                    ),
                },
            ],
        )
        text = response.output_text.strip()
        insights = [line.strip("- ").strip() for line in text.splitlines() if line.strip()]
        return insights[:3]
