/**
 * Decap CMS GitHub OAuth Authenticator Cloudflare Worker
 * Strict Identity Verification: Authorized User "im0d00" ONLY
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Allowed GitHub User (Default: im0d00)
    const allowedRaw = env.ALLOWED_GITHUB_USER || "im0d00";
    const ALLOWED_USERS = allowedRaw.split(",").map(u => u.trim().toLowerCase()).filter(Boolean);

    // 1. /auth - Redirect user to GitHub OAuth login
    if (url.pathname === "/auth") {
      const clientId = env.GITHUB_CLIENT_ID;
      if (!clientId) {
        return renderHtmlError("Configuration Error: GITHUB_CLIENT_ID environment variable is missing on Cloudflare Worker.", 500);
      }

      const scope = url.searchParams.get("scope") || "repo";
      const state = crypto.randomUUID();

      const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
      githubAuthUrl.searchParams.set("client_id", clientId);
      githubAuthUrl.searchParams.set("scope", scope);
      githubAuthUrl.searchParams.set("state", state);

      return Response.redirect(githubAuthUrl.toString(), 302);
    }

    // 2. /callback - Receive OAuth code from GitHub & Verify User
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return renderHtmlError("Missing authorization code in GitHub OAuth response.", 400);
      }

      const clientId = env.GITHUB_CLIENT_ID;
      const clientSecret = env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return renderHtmlError("Server Configuration Error: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET secret missing on Cloudflare Worker.", 500);
      }

      try {
        // Exchange code for access token with GitHub
        const oauthEndpoint = env.OAUTH_ENDPOINT || "https://github.com/login/oauth/access_token";
        const tokenResponse = await fetch(oauthEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Decap-CMS-Cloudflare-Worker"
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error || !tokenData.access_token) {
          return renderHtmlError(`GitHub OAuth Error: ${tokenData.error_description || tokenData.error || "Failed to retrieve access token"}`, 400);
        }

        const accessToken = tokenData.access_token;

        // Fetch authenticated GitHub user profile directly from GitHub API
        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            "Authorization": `token ${accessToken}`,
            "User-Agent": "Decap-CMS-Cloudflare-Worker",
            "Accept": "application/vnd.github.v3+json"
          },
        });

        if (!userResponse.ok) {
          return renderHtmlError("Failed to verify authenticated GitHub user profile.", 401);
        }

        const userData = await userResponse.json();
        const authenticatedUsername = (userData.login || "").trim().toLowerCase();

        // STRICT IDENTITY AUTHORIZATION CHECK: Reject all users except authorized account owner im0doo
        if (!ALLOWED_USERS.includes(authenticatedUsername)) {
          console.warn(`Unauthorized CMS access attempt by GitHub user: @${userData.login}`);
          return renderHtmlAccessDenied(userData.login);
        }

        // Return Decap CMS postMessage response
        return renderDecapSuccessResponse(accessToken);

      } catch (err) {
        return renderHtmlError(`Authentication failed: ${err.message}`, 500);
      }
    }

    // Default route response
    return new Response(
      JSON.stringify({
        status: "online",
        service: "Decap CMS GitHub OAuth Authenticator Worker",
        authorized_accounts: ALLOWED_USERS,
        endpoints: ["/auth", "/callback"]
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
};

/**
 * Render postMessage response for Decap CMS popup window
 */
function renderDecapSuccessResponse(token) {
  const content = JSON.stringify({
    token: token,
    provider: "github"
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Successful — Decap CMS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #080C1A; color: #F0F4FF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #0D1A30; border: 1px solid rgba(0, 212, 255, 0.3); padding: 2.5rem; border-radius: 12px; box-shadow: 0 0 40px rgba(0, 212, 255, 0.15); max-width: 420px; }
    .icon { font-size: 3rem; color: #00FF88; margin-bottom: 1rem; }
    h2 { margin: 0 0 0.5rem 0; color: #00D4FF; font-size: 1.4rem; }
    p { color: #6B7FA3; font-size: 0.9rem; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Authenticated as im0d00</h2>
    <p>Identity verified successfully. Connecting to Decap CMS dashboard...</p>
  </div>
  <script>
    (function() {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:success:${content}',
          e.origin
        );
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

/**
 * Render Access Denied Page for Unauthorized GitHub Users
 */
function renderHtmlAccessDenied(username) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Access Denied — Decap CMS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #080C1A; color: #F0F4FF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #0D1A30; border: 1px solid rgba(229, 57, 53, 0.4); padding: 2.5rem; border-radius: 12px; box-shadow: 0 0 40px rgba(229, 57, 53, 0.2); max-width: 440px; }
    .icon { font-size: 3rem; color: #E53935; margin-bottom: 1rem; }
    h2 { margin: 0 0 0.5rem 0; color: #FF4D4D; font-size: 1.4rem; }
    p { color: #94A3B8; font-size: 0.95rem; line-height: 1.5; }
    .user { color: #00D4FF; font-weight: bold; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⛔</div>
    <h2>Access Denied</h2>
    <p>Access denied. The GitHub account <span class="user">@${escapeHtml(username)}</span> is not authorized to access the CMS.</p>
    <p style="font-size: 0.8rem; margin-top: 1.5rem; color: #64748B;">Only the authorized administrator (<strong style="color:#00D4FF">im0d00</strong>) is permitted to access Decap CMS.</p>
  </div>
  <script>
    (function() {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:error:{"message":"Access denied. This GitHub account is not authorized to access the CMS."}',
          e.origin
        );
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 403,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

/**
 * Render Generic HTML Error Response
 */
function renderHtmlError(message, status = 400) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #080C1A; color: #F0F4FF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #0D1A30; border: 1px solid rgba(255, 183, 0, 0.3); padding: 2rem; border-radius: 12px; max-width: 420px; }
    h2 { margin: 0 0 0.5rem 0; color: #FFB700; font-size: 1.3rem; }
    p { color: #94A3B8; font-size: 0.9rem; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Authentication Error</h2>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: status,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
