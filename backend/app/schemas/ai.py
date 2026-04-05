from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)
    system_prompt: str | None = None


class ChatResponse(BaseModel):
    reply: str
    provider: str


class ProfilePayload(BaseModel):
    id: str | None = None
    user_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    date_of_birth: str | None = None
    religion: str | None = None
    community: str | None = None
    caste: str | None = None
    education: str | None = None
    education_detail: str | None = None
    profession: str | None = None
    income: str | None = None
    location: str | None = None
    state: str | None = None
    height: str | None = None
    marital_status: str | None = None
    family_values: str | None = None
    rashi: str | None = None
    nakshatra: str | None = None
    manglik: bool | None = None
    guna_score: int | None = None
    verified: bool | None = None
    profile_complete: bool | None = None
    match_score: int | None = None


class PreferencePayload(BaseModel):
    min_age: int | None = None
    max_age: int | None = None
    preferred_religion: str | None = None
    preferred_communities: list[str] | None = None
    preferred_education: list[str] | None = None
    preferred_locations: list[str] | None = None
    preferred_marital_status: str | None = None
    min_height: str | None = None
    max_height: str | None = None


class MatchRequest(BaseModel):
    current_profile: ProfilePayload
    preferences: PreferencePayload | None = None
    candidates: list[ProfilePayload] = Field(default_factory=list)


class MatchResult(BaseModel):
    profile_id: str
    score: int
    insights: list[str] = Field(default_factory=list)


class MatchResponse(BaseModel):
    matches: list[MatchResult] = Field(default_factory=list)
    provider: str
