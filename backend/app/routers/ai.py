from fastapi import APIRouter

from app.schemas.ai import ChatRequest, ChatResponse, MatchRequest, MatchResponse
from app.services.llm import LLMService
from app.services.matching import MatchmakingService

router = APIRouter(prefix="/ai", tags=["ai"])

llm_service = LLMService()
matching_service = MatchmakingService(llm_service=llm_service)

DEFAULT_SYSTEM_PROMPT = (
    "You are Chellam AI, a friendly and helpful virtual assistant for the Chellam Matrimony platform. "
    "Keep answers warm, simple, and concise."
)


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    reply = llm_service.chat(
        system_prompt=payload.system_prompt or DEFAULT_SYSTEM_PROMPT,
        messages=[message.model_dump() for message in payload.messages[-10:]],
    )
    provider = "openai" if llm_service.enabled else "fallback"
    return ChatResponse(reply=reply, provider=provider)


@router.post("/match", response_model=MatchResponse)
def match_profiles(payload: MatchRequest) -> MatchResponse:
    matches = matching_service.rank_candidates(
        current_profile=payload.current_profile,
        preferences=payload.preferences,
        candidates=payload.candidates,
    )
    provider = "openai+rules" if llm_service.enabled else "rules"
    return MatchResponse(matches=matches, provider=provider)
