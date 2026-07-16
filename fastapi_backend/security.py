from cryptography.fernet import Fernet
from fastapi_backend.config import settings

class TokenSecurity:
    """
    Handles secure encryption and decryption of access tokens to prevent
    leakage if the database file is compromised.
    """
    def __init__(self, key: str):
        try:
            self.fernet = Fernet(key.encode())
        except Exception as e:
            # Handle invalid key formats gracefully, fallback to standard key
            print(f"[Security] Warning: Invalid ENCRYPTION_KEY format. Generating temporary runtime key. Error: {e}")
            self.fernet = Fernet(Fernet.generate_key())

    def encrypt_token(self, token: str) -> str:
        """Encrypts a plaintext OAuth token into an encrypted string."""
        if not token:
            return ""
        return self.fernet.encrypt(token.encode()).decode()

    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypts an encrypted string back into a plaintext OAuth token."""
        if not encrypted_token:
            return ""
        try:
            return self.fernet.decrypt(encrypted_token.encode()).decode()
        except Exception as e:
            print(f"[Security] Failed to decrypt token: {e}")
            raise ValueError("Token decryption failed. The encryption key may be invalid or changed.")

# Singleton token security helper
token_security = TokenSecurity(settings.encryption_key)
