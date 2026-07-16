import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from fastapi_backend.database import Base
from fastapi_backend.security import token_security

class User(Base):
    """
    User model to store ingested profile information from GitHub.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    token_association = relationship("OAuthToken", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User username={self.username} github_id={self.github_id}>"


class OAuthToken(Base):
    """
    OAuthToken model to store encrypted GitHub OAuth credentials.
    """
    __tablename__ = "oauth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Store the access token securely using AES-256 Fernet symmetric encryption
    encrypted_access_token = Column(String, nullable=False)
    scopes = Column(String, nullable=True)  # Comma-separated or space-separated list of scopes
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="token_association")

    @property
    def plaintext_token(self) -> str:
        """Helper property to decrypt and retrieve the raw OAuth access token."""
        return token_security.decrypt_token(self.encrypted_access_token)

    @plaintext_token.setter
    def plaintext_token(self, value: str):
        """Helper setter to encrypt and store the raw OAuth access token."""
        self.encrypted_access_token = token_security.encrypt_token(value)

    def __repr__(self):
        return f"<OAuthToken user_id={self.user_id} scopes={self.scopes}>"
