import uuid
from datetime import date, datetime
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class InterestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String)
    first_name: Mapped[str | None] = mapped_column(String)
    last_name: Mapped[str | None] = mapped_column(String)
    gender: Mapped[str | None] = mapped_column(String)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    religion: Mapped[str | None] = mapped_column(String)
    community: Mapped[str | None] = mapped_column(String)
    caste: Mapped[str | None] = mapped_column(String)
    bio: Mapped[str | None] = mapped_column(Text)
    education: Mapped[str | None] = mapped_column(String)
    education_detail: Mapped[str | None] = mapped_column(String)
    profession: Mapped[str | None] = mapped_column(String)
    income: Mapped[str | None] = mapped_column(String)
    location: Mapped[str | None] = mapped_column(String)
    state: Mapped[str | None] = mapped_column(String)
    height: Mapped[str | None] = mapped_column(String)
    marital_status: Mapped[str | None] = mapped_column(String, default="Never Married")
    photo_url: Mapped[str | None] = mapped_column(String)
    family_type: Mapped[str | None] = mapped_column(String)
    father_occupation: Mapped[str | None] = mapped_column(String)
    mother_occupation: Mapped[str | None] = mapped_column(String)
    siblings: Mapped[str | None] = mapped_column(String)
    family_values: Mapped[str | None] = mapped_column(String)
    rashi: Mapped[str | None] = mapped_column(String)
    nakshatra: Mapped[str | None] = mapped_column(String)
    manglik: Mapped[bool | None] = mapped_column(Boolean, default=False)
    guna_score: Mapped[int | None] = mapped_column(Integer, default=0)
    verified: Mapped[bool | None] = mapped_column(Boolean, default=False)
    profile_complete: Mapped[bool | None] = mapped_column(Boolean, default=False)
    match_score: Mapped[int | None] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class PartnerPreference(Base):
    __tablename__ = "partner_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    min_age: Mapped[int | None] = mapped_column(Integer, default=21)
    max_age: Mapped[int | None] = mapped_column(Integer, default=35)
    preferred_religion: Mapped[str | None] = mapped_column(String)
    preferred_communities: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    preferred_education: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    preferred_locations: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    preferred_marital_status: Mapped[str | None] = mapped_column(String)
    min_height: Mapped[str | None] = mapped_column(String)
    max_height: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class Interest(Base):
    __tablename__ = "interests"
    __table_args__ = (UniqueConstraint("sender_id", "receiver_id", name="uq_interest_sender_receiver"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    receiver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    status: Mapped[InterestStatus] = mapped_column(SqlEnum(InterestStatus, name="interest_status"), default=InterestStatus.PENDING, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class Shortlist(Base):
    __tablename__ = "shortlists"
    __table_args__ = (UniqueConstraint("user_id", "profile_id", name="uq_shortlist_user_profile"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class DailyMatch(Base):
    __tablename__ = "daily_matches"
    __table_args__ = (
        UniqueConstraint("user_id", "match_user_id", "match_date", name="uq_daily_match_user_match_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    match_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    compatibility_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    match_reasons: Mapped[list[str] | None] = mapped_column(JSONB, default=list)
    match_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class ProfileView(Base):
    __tablename__ = "profile_views"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    viewer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    viewed_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    viewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
