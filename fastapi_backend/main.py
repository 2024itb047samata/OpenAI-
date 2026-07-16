import urllib.parse
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from itsdangerous import Signer, BadSignature
from typing import List

# Import our custom modules
from fastapi_backend.config import settings
from fastapi_backend.database import engine, Base, get_db
from fastapi_backend.models import User, OAuthToken
from fastapi_backend.schemas import UserResponse, RepositoryResponse, OAuthUrlResponse, StatusResponse
from fastapi_backend.security import token_security

# Initialize FastAPI application
app = FastAPI(
    title="Chronos GitHub OAuth Backend",
    description="Secure FastAPI-based microservice demonstrating robust GitHub OAuth, secure SQLite token storage, and repository ingestion.",
    version="1.0.0"
)

# Enable CORS for cross-origin local preview operations
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.app_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
def startup_event():
    print("[Database] Initializing tables in SQLite...")
    Base.metadata.create_all(bind=engine)
    print("[Database] All tables initialized successfully.")

# Secure Session Signature helper
signer = Signer(settings.fastapi_secret_key)

def get_session_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    FastAPI dependency that extracts and validates the signed user session cookie.
    Throws HTTP 401 Unauthorized if the session is missing, invalid, or forged.
    """
    session_cookie = request.cookies.get("session_id")
    if not session_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session missing. Please authenticate via GitHub OAuth."
        )
    
    try:
        # Validate cookie signature to prevent tampering
        unsigned_id_bytes = signer.unsign(session_cookie)
        user_id = int(unsigned_id_bytes.decode())
    except (BadSignature, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or tempered session token. Re-authentication required."
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Associated session user not found in database."
        )
    return user


# -----------------------------------------------------------------------------
# OAUTH ROUTING ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/auth/url", response_model=OAuthUrlResponse, tags=["Authentication"])
def get_oauth_url():
    """
    1. Returns the constructed GitHub OAuth authorization URL.
    The client frontend fetches this and opens it directly in a popup.
    """
    if not settings.github_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GITHUB_CLIENT_ID is not configured in the backend environment."
        )

    # Use state / scope for standard secure GitHub OAuth setup
    redirect_uri = f"{settings.app_url}/auth/callback"
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": redirect_uri,
        "scope": "read:user repo",  # Get standard profile read permission + full repository access
        "state": "chronos_secure_session_token_state"
    }
    
    auth_base_url = "https://github.com/login/oauth/authorize"
    full_url = f"{auth_base_url}?{urllib.parse.urlencode(params)}"
    return OAuthUrlResponse(url=full_url)


@app.get("/auth/callback", response_class=HTMLResponse, tags=["Authentication"])
async def oauth_callback(code: str, state: str = None, response: Response = None, db: Session = Depends(get_db)):
    """
    2. Receives temporary authorization code from GitHub,
    exchanges it for an Access Token, retrieves profile metadata,
    and secures everything in SQLite.
    """
    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub client credentials are unconfigured on this station."
        )

    # A. Exchange code for access token
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                json={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code
                },
                timeout=10.0
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to reach GitHub authorization servers: {str(e)}"
            )

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_GATEWAY,
                detail="GitHub refused code-to-token validation exchange."
            )

        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            error_desc = token_data.get("error_description", "No token returned")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub token exchange rejected: {error_desc}"
            )

        # B. Retrieve authenticated User profile metadata
        try:
            profile_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/json",
                    "User-Agent": "FastAPI-OAuth-Microservice"
                },
                timeout=5.0
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch user metadata from GitHub: {str(e)}"
            )

        if profile_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not retrieve profile info from token authorization."
            )

        profile_data = profile_response.json()
        github_id = profile_data.get("id")
        username = profile_data.get("login")
        avatar_url = profile_data.get("avatar_url")
        email = profile_data.get("email")

        # C. Upsert User into Database
        user = db.query(User).filter(User.github_id == github_id).first()
        if not user:
            user = User(
                github_id=github_id,
                username=username,
                avatar_url=avatar_url,
                email=email
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update dynamic values
            user.username = username
            user.avatar_url = avatar_url
            user.email = email
            db.commit()

        # D. Securely Store the Token (Encrypting plaintext using security wrapper)
        token_record = db.query(OAuthToken).filter(OAuthToken.user_id == user.id).first()
        if not token_record:
            token_record = OAuthToken(user_id=user.id, scopes=token_data.get("scope"))
            # Custom setter automatically encrypts via token_security.encrypt_token
            token_record.plaintext_token = access_token
            db.add(token_record)
        else:
            token_record.scopes = token_data.get("scope")
            token_record.plaintext_token = access_token
        
        db.commit()

        # E. Sign cookie session and configure with sameSite='none' / secure=True for iframe context
        session_payload = str(user.id).encode()
        signed_session_id = signer.sign(session_payload).decode()
        
        # Build success popup closing HTML response with postMessage
        popup_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Successful</title>
            <style>
                body {{
                    background-color: #020617;
                    color: #f8fafc;
                    font-family: 'Inter', system-ui, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }}
                .spinner {{
                    border: 3px solid rgba(99, 102, 241, 0.1);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border-left-color: #6366f1;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }}
                @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
                h2 {{ margin: 0 0 8px 0; color: #fff; font-size: 18px; }}
                p {{ color: #94a3b8; font-size: 13px; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="spinner"></div>
            <h2>Connecting Secure Session...</h2>
            <p>GitHub verification succeeded. Syncing with Chronos Workspace...</p>
            <script>
                // Post success message back to the primary parent window iframe
                if (window.opener) {{
                    window.opener.postMessage({{ 
                        type: 'OAUTH_AUTH_SUCCESS', 
                        user: {{
                            id: {user.id},
                            login: "{user.username}",
                            avatar_url: "{user.avatar_url or ''}"
                        }}
                    }}, '*');
                    
                    // Close this popup window automatically
                    setTimeout(function() {{
                        window.close();
                    }}, 1000);
                }} else {{
                    window.location.href = '/';
                }}
            </script>
        </body>
        </html>
        """
        
        # Package and apply cookie to the HTML callback response
        callback_response = HTMLResponse(content=popup_html)
        callback_response.set_cookie(
            key="session_id",
            value=signed_session_id,
            httponly=True,
            samesite="none",
            secure=True,  # Crucial for cross-origin iframe security validations
            max_age=14 * 24 * 3600  # 14 days expiration
        )
        return callback_response


@app.post("/auth/logout", response_model=StatusResponse, tags=["Authentication"])
def logout(response: Response, user: User = Depends(get_session_user)):
    """
    3. Invalidates user session cookie securely.
    """
    response.delete_cookie(
        key="session_id",
        samesite="none",
        secure=True,
        httponly=True
    )
    return StatusResponse(success=True, message="OAuth session securely logged out.")


# -----------------------------------------------------------------------------
# PROTECTED FORENSIC ENDPOINTS (REQUIRE SECURE SESSION)
# -----------------------------------------------------------------------------

@app.get("/api/user", response_model=UserResponse, tags=["Forensic API"])
def get_user_profile(user: User = Depends(get_session_user)):
    """
    Returns verified active session user profile details.
    """
    return user


@app.get("/api/repositories", response_model=List[RepositoryResponse], tags=["Forensic API"])
async def get_user_repositories(
    user: User = Depends(get_session_user),
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 20
):
    """
    Retrieves the user's authentic repository index directly from GitHub,
    authenticated using their decrypted access token fetched from the local SQLite database.
    """
    # Find associated encrypted token
    token_record = db.query(OAuthToken).filter(OAuthToken.user_id == user.id).first()
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access credentials mismatch. Secure decryption token could not be loaded."
        )

    try:
        # Securely decrypt the token on-the-fly
        access_token = token_record.plaintext_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security subsystem decryption failure: {str(e)}"
        )

    # Query GitHub API directly with the secure decrypted token
    async with httpx.AsyncClient() as client:
        try:
            repo_response = await client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "FastAPI-OAuth-Microservice"
                },
                params={
                    "sort": "updated",
                    "direction": "desc",
                    "page": page,
                    "per_page": per_page
                },
                timeout=10.0
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to execute lookup with GitHub servers: {str(e)}"
            )

        if repo_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub rejected token lookup authentication. Status: {repo_response.status_code}"
            )

        repos_data = repo_response.json()
        if not isinstance(repos_data, list):
            return []

        parsed_repos = []
        for r in repos_data:
            parsed_repos.append(
                RepositoryResponse(
                    id=r.get("id"),
                    name=r.get("name"),
                    full_name=r.get("full_name"),
                    html_url=r.get("html_url"),
                    description=r.get("description"),
                    stargazers_count=r.get("stargazers_count", 0),
                    language=r.get("language"),
                    updated_at=r.get("updated_at", "")
                )
            )
        return parsed_repos


# Custom Exception handler for standard JSON serialization of errors
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )
