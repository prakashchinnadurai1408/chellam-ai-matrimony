from datetime import date, datetime

from app.schemas.ai import MatchResult, PreferencePayload, ProfilePayload
from app.services.llm import LLMService


def _age_from_dob(date_of_birth: str | None) -> int | None:
    if not date_of_birth:
        return None
    try:
        birth_date = date.fromisoformat(date_of_birth)
    except ValueError:
        try:
            birth_date = datetime.fromisoformat(date_of_birth).date()
        except ValueError:
            return None

    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _income_to_number(raw_income: str | None) -> int | None:
    if not raw_income:
        return None
    digits = "".join(ch for ch in raw_income if ch.isdigit())
    return int(digits) if digits else None


class MatchmakingService:
    def __init__(self, llm_service: LLMService) -> None:
        self.llm_service = llm_service

    def rank_candidates(
        self,
        current_profile: ProfilePayload,
        preferences: PreferencePayload | None,
        candidates: list[ProfilePayload],
    ) -> list[MatchResult]:
        ranked: list[MatchResult] = []
        current_age = _age_from_dob(current_profile.date_of_birth)

        for candidate in candidates:
            score, reasons = self._score_candidate(current_profile, preferences, candidate, current_age)
            llm_reasons = self.llm_service.generate_match_insights(
                current_profile.model_dump(exclude_none=True),
                preferences.model_dump(exclude_none=True) if preferences else None,
                candidate.model_dump(exclude_none=True),
                score,
            )
            insights = llm_reasons or reasons[:3]
            ranked.append(
                MatchResult(
                    profile_id=candidate.id or candidate.user_id or "",
                    score=max(0, min(100, round(score))),
                    insights=insights[:3],
                )
            )

        ranked.sort(key=lambda item: item.score, reverse=True)
        return ranked

    def _score_candidate(
        self,
        current_profile: ProfilePayload,
        preferences: PreferencePayload | None,
        candidate: ProfilePayload,
        current_age: int | None,
    ) -> tuple[int, list[str]]:
        score = 0
        reasons: list[str] = []
        candidate_age = _age_from_dob(candidate.date_of_birth)

        if preferences:
            pref_points = 0
            if candidate_age and preferences.min_age and preferences.max_age and preferences.min_age <= candidate_age <= preferences.max_age:
                pref_points += 8
                reasons.append("Age fits your preferred range.")
            if preferences.preferred_religion and candidate.religion == preferences.preferred_religion:
                pref_points += 7
                reasons.append("Religion aligns with your stated preference.")
            if preferences.preferred_communities and candidate.community in preferences.preferred_communities:
                pref_points += 5
                reasons.append("Community preference is a match.")
            if preferences.preferred_education and candidate.education in preferences.preferred_education:
                pref_points += 5
                reasons.append("Education background matches your preference.")
            if preferences.preferred_locations and (
                candidate.location in preferences.preferred_locations or candidate.state in preferences.preferred_locations
            ):
                pref_points += 5
                reasons.append("Location is within your preferred area.")
            if preferences.preferred_marital_status and candidate.marital_status == preferences.preferred_marital_status:
                pref_points += 5
                reasons.append("Marital status matches your preference.")
            score += min(pref_points, 30)

        demographic = 0
        if current_age and candidate_age:
            gap = abs(current_age - candidate_age)
            if gap <= 2:
                demographic += 10
                reasons.append("You are in a very similar age bracket.")
            elif gap <= 5:
                demographic += 7
            elif gap <= 8:
                demographic += 4
        if current_profile.state and candidate.state and current_profile.state == candidate.state:
            demographic += 6
            reasons.append("You are based in the same state.")
        elif current_profile.location and candidate.location and current_profile.location == candidate.location:
            demographic += 4
        if current_profile.marital_status and candidate.marital_status and current_profile.marital_status == candidate.marital_status:
            demographic += 4
        score += min(demographic, 20)

        socio_cultural = 0
        if current_profile.religion and candidate.religion and current_profile.religion == candidate.religion:
            socio_cultural += 7
        if current_profile.community and candidate.community and current_profile.community == candidate.community:
            socio_cultural += 6
        if current_profile.caste and candidate.caste and current_profile.caste == candidate.caste:
            socio_cultural += 3
        if current_profile.family_values and candidate.family_values and current_profile.family_values == candidate.family_values:
            socio_cultural += 4
            reasons.append("Family values appear compatible.")
        score += min(socio_cultural, 20)

        professional = 0
        if current_profile.education and candidate.education and current_profile.education == candidate.education:
            professional += 7
            reasons.append("Education level is closely aligned.")
        current_income = _income_to_number(current_profile.income)
        candidate_income = _income_to_number(candidate.income)
        if current_income and candidate_income:
            gap = abs(current_income - candidate_income)
            if gap <= 5:
                professional += 8
            elif gap <= 15:
                professional += 5
            else:
                professional += 2
        elif current_profile.profession and candidate.profession:
            professional += 4
        score += min(professional, 15)

        horoscope = 0
        if current_profile.rashi and candidate.rashi and current_profile.rashi == candidate.rashi:
            horoscope += 5
        if current_profile.nakshatra and candidate.nakshatra and current_profile.nakshatra == candidate.nakshatra:
            horoscope += 5
        if current_profile.manglik is not None and candidate.manglik is not None and current_profile.manglik == candidate.manglik:
            horoscope += 5
            reasons.append("Horoscope indicators are broadly compatible.")
        score += min(horoscope, 15)

        if not reasons:
            reasons = [
                "This profile overlaps with several of your key filters.",
                "Demographic and lifestyle details are reasonably compatible.",
                "Compatibility can improve further once both profiles are more detailed.",
            ]

        return score, reasons
