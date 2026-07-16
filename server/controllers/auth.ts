import { Request, Response } from "express";
import { gitHubService } from "../services/github";
import { geminiService } from "../services/gemini";

/**
 * Replicates the original in-memory OAuth session storage.
 * To reduce coupling, this is encapsulated in an auth session manager.
 */
class GitHubAuthSession {
  private accessToken: string | null = null;
  private user: any = null;

  public setSession(token: string, user: any) {
    this.accessToken = token;
    this.user = user;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getUser(): any {
    return this.user;
  }

  public clearSession() {
    this.accessToken = null;
    this.user = null;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const authSession = new GitHubAuthSession();

export class AuthController {
  /**
   * 1. Get OAuth login URL
   */
  public getLoginUrl(req: Request, res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({
        error: "GitHub OAuth client ID is not configured on the server. Please add GITHUB_CLIENT_ID to settings.",
      });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      scope: "repo,read:user",
      allow_signup: "true",
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return res.json({ url: authUrl });
  }

  /**
   * 2. OAuth Callback Handler
   */
  public async handleCallback(req: Request, res: Response) {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("<h3>OAuth Error: Code missing in callback.</h3>");
    }

    try {
      console.log("[OAuth Controller] Exchanging temporary code for access token...");
      const data = await gitHubService.exchangeOAuthCode(code as string);
      const accessToken = data.access_token;

      // Fetch authenticated user details
      const user = await gitHubService.getAuthenticatedUser(accessToken);
      console.log(`[OAuth Controller] Successfully logged in as: ${user.login}`);

      // Save to global in-memory session manager
      authSession.setSession(accessToken, user);

      // Return standard popup success message payload
      return res.send(`
        <html>
          <head>
            <title>Auth Success</title>
            <style>
              body { font-family: sans-serif; background: #0b1329; color: #f1f5f9; text-align: center; padding-top: 100px; }
              h2 { color: #818cf8; }
              .spinner { border: 4px solid rgba(255,255,255,0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #818cf8; animate: spin 1s linear infinite; margin: 20px auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <h2>Authentication Successful</h2>
            <p>Logged in as <strong>${user.login}</strong></p>
            <div class="spinner"></div>
            <p>This window will close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("[OAuth Controller] Callback handling error:", err);
      return res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; background: #0b1329; color: #f1f5f9; padding: 40px;">
            <h2 style="color: #ef4444;">OAuth Authentication Failed</h2>
            <p>Reason: ${err.message || "An unknown server error occurred."}</p>
            <button onclick="window.close()" style="background: #312e81; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Window</button>
          </body>
        </html>
      `);
    }
  }

  /**
   * 3. Get Authenticated User status
   */
  public getUserStatus(req: Request, res: Response) {
    return res.json({
      authenticated: authSession.isAuthenticated(),
      user: authSession.getUser(),
    });
  }

  /**
   * 4. Logout / Disconnect GitHub session
   */
  public handleLogout(req: Request, res: Response) {
    authSession.clearSession();
    return res.json({ status: "logged_out" });
  }

  /**
   * 5. Save settings secret API key
   */
  public saveSecret(req: Request, res: Response) {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: "Secret key is required." });
    }
    process.env.GEMINI_API_KEY = key;
    // Reset any cached Gemini Client so it picks up the new key immediately
    geminiService.resetClient();
    return res.json({ success: true, hasApiKey: true });
  }
}

export const authController = new AuthController();
