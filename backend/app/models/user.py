from typing import TYPE_CHECKING

from pydantic import ConfigDict, EmailStr
from sqlmodel import Field, Relationship

from app.models.common import BaseModel, UserRole

if TYPE_CHECKING:
    from app.models.competition import Competition


class User(BaseModel, table=True):  # type: ignore[call-arg]
    """User model for authentication and authorization."""

    __tablename__ = "users"

    email: EmailStr = Field(unique=True, index=True)
    full_name: str = Field(min_length=1, max_length=100)
    organization: str = Field(min_length=1, max_length=100)
    phone_number: str = Field(min_length=10, max_length=20)
    role: UserRole = Field(default=UserRole.CREATOR)
    hashed_password: str = Field(min_length=1)
    is_active: bool = True

    # Relationships
    competitions: list["Competition"] = Relationship(
        back_populates="owner",
        sa_relationship_kwargs={"primaryjoin": "User.id==Competition.owner_id"},
    )

    model_config = ConfigDict(from_attributes=True)
