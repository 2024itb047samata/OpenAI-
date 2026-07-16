from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    github_id: int
    username: str
    avatar_url: Optional[str] = None
    email: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 compatibility for ORM mapping (previously orm_mode=True)


class RepositoryResponse(BaseModel):
    """
    Slightly structured GitHub Repository metadata returned from the API.
    """
    id: int
    name: str
    full_name: str
    html_url: HttpUrl
    description: Optional[str] = None
    stargazers_count: int
    language: Optional[str] = None
    updated_at: str


class OAuthUrlResponse(BaseModel):
    """
    Response schema returning the constructed GitHub OAuth URL.
    """
    url: str


class StatusResponse(BaseModel):
    """
    Simple status message schema.
    """
    success: bool
    message: str
