from datetime import datetime
from pydantic import Field, EmailStr
from sqlmodel import SQLModel

# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int | None = None


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None
    exp: int | None = None
    type: str | None = None
    iat: int | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class ForgotPasswordRequest(SQLModel):
    email: EmailStr = Field(description="User's email address")


class ForgotPasswordResponse(SQLModel):
    message: str
    token: str = Field(description="Password reset token (for testing only)")


class ResetPasswordRequest(SQLModel):
    token: str = Field(description="Password reset token")
    new_password: str = Field(min_length=8, max_length=40, description="New password")
