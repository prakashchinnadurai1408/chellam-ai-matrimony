import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MembershipTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    CONCIERGE = "concierge"


class PaymentSetting(Base):
    __tablename__ = "payment_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upi_id: Mapped[str | None] = mapped_column(String)
    qr_image_url: Mapped[str | None] = mapped_column(String)
    premium_monthly_price: Mapped[int] = mapped_column(Integer, default=499, nullable=False)
    premium_annual_price: Mapped[int] = mapped_column(Integer, default=3999, nullable=False)
    concierge_monthly_price: Mapped[int] = mapped_column(Integer, default=1999, nullable=False)
    concierge_annual_price: Mapped[int] = mapped_column(Integer, default=15999, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class Membership(Base):
    __tablename__ = "memberships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    tier: Mapped[MembershipTier] = mapped_column(SqlEnum(MembershipTier, name="membership_tier"), default=MembershipTier.FREE, nullable=False)
    plan_type: Mapped[str | None] = mapped_column(String, default="monthly")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    tier: Mapped[MembershipTier] = mapped_column(SqlEnum(MembershipTier, name="membership_tier"), nullable=False)
    plan_type: Mapped[str] = mapped_column(String, default="monthly", nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    upi_transaction_id: Mapped[str | None] = mapped_column(Text)
    screenshot_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="pending", nullable=False)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
