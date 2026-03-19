/**
 * OAuth PKCE flow for Spotify Web API.
 * Allows users to authenticate with their own Spotify Developer App
 * to bypass rate limits on CosmosAsync.
 *
 * Setup:
 * 1. Go to https://developer.spotify.com/dashboard
 * 2. Create a new app
 * 3. Add redirect URI: http://127.0.0.1:5173/callback
 * 4. Copy the Client ID to Stats settings
 */

const STORAGE_PREFIX = "stats:oauth:";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const SCOPES = [
	"user-top-read",
	"user-read-recently-played",
	"user-library-read",
].join(" ");

// Token storage keys
const KEYS = {
	accessToken: `${STORAGE_PREFIX}access_token`,
	refreshToken: `${STORAGE_PREFIX}refresh_token`,
	expiresAt: `${STORAGE_PREFIX}expires_at`,
	codeVerifier: `${STORAGE_PREFIX}code_verifier`,
};

function getConfigValue<T>(key: string): T | null {
	const value = localStorage.getItem(`stats:config:${key}`);
	if (value === null) return null;

	try {
		return JSON.parse(value) as T;
	} catch {
		return value as T;
	}
}

/**
 * Generate a random string for PKCE code verifier
 */
function generateRandomString(length: number): string {
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
	const values = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(values).map((x) => possible[x % possible.length]).join("");
}

/**
 * SHA256 hash for PKCE code challenge
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	return crypto.subtle.digest("SHA-256", data);
}

/**
 * Base64URL encode for PKCE
 */
function base64urlEncode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let str = "";
	bytes.forEach((b) => (str += String.fromCharCode(b)));
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate PKCE code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
	const hashed = await sha256(verifier);
	return base64urlEncode(hashed);
}

/**
 * Check if OAuth is enabled and configured
 */
export function isOAuthEnabled(): boolean {
	const clientId = getConfigValue<string>("oauth-client-id");
	const useOAuth = getConfigValue<boolean>("use-oauth");
	return useOAuth && clientId && clientId.length > 0;
}

/**
 * Check if we have valid OAuth tokens
 */
export function hasValidTokens(): boolean {
	const accessToken = localStorage.getItem(KEYS.accessToken);
	const expiresAt = localStorage.getItem(KEYS.expiresAt);
	const refreshToken = localStorage.getItem(KEYS.refreshToken);
	if (refreshToken) return true;
	if (!accessToken || !expiresAt) return false;
	// Consider token invalid if it expires in less than 5 minutes
	return Date.now() < parseInt(expiresAt) - 5 * 60 * 1000;
}

/**
 * Get the current access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string | null> {
	const accessToken = localStorage.getItem(KEYS.accessToken);
	const expiresAt = localStorage.getItem(KEYS.expiresAt);
	const refreshToken = localStorage.getItem(KEYS.refreshToken);

	if (!accessToken) return null;

	// Check if token needs refresh (expires in less than 5 minutes)
	if (expiresAt && Date.now() > parseInt(expiresAt) - 5 * 60 * 1000) {
		if (refreshToken) {
			try {
				await refreshAccessToken();
				return localStorage.getItem(KEYS.accessToken);
			} catch (e) {
				console.error("stats - OAuth token refresh failed:", e);
				clearTokens();
				return null;
			}
		}
		return null;
	}

	return accessToken;
}

/**
 * Initiate OAuth authorization flow
 */
export async function startAuthFlow(): Promise<void> {
	const clientId = getConfigValue<string>("oauth-client-id");
	if (!clientId) {
		Spicetify.showNotification("Please enter your Spotify Client ID first", true);
		return;
	}

	// Generate and store PKCE code verifier
	const codeVerifier = generateRandomString(128);
	localStorage.setItem(KEYS.codeVerifier, codeVerifier);

	const codeChallenge = await generateCodeChallenge(codeVerifier);

	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: REDIRECT_URI,
		code_challenge_method: "S256",
		code_challenge: codeChallenge,
		scope: SCOPES,
	});

	const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

	// Open in browser and show instructions
	Spicetify.showNotification(
		"Opening browser for Spotify authorization. After approval, copy the URL from the browser.",
		false,
		5000
	);

	// Open auth URL - this will redirect to localhost which won't work,
	// but user can copy the callback URL
	window.open(authUrl, "_blank");
}

/**
 * Complete OAuth flow by exchanging authorization code for tokens
 */
export async function handleCallback(callbackUrl: string): Promise<boolean> {
	try {
		const url = new URL(callbackUrl);
		const code = url.searchParams.get("code");
		const error = url.searchParams.get("error");

		if (error) {
			console.error("stats - OAuth error:", error);
			Spicetify.showNotification(`Authorization failed: ${error}`, true);
			return false;
		}

		if (!code) {
			Spicetify.showNotification("No authorization code found in URL", true);
			return false;
		}

		const clientId = getConfigValue<string>("oauth-client-id");
		const codeVerifier = localStorage.getItem(KEYS.codeVerifier);

		if (!clientId || !codeVerifier) {
			Spicetify.showNotification("Missing client ID or code verifier", true);
			return false;
		}

		// Exchange code for tokens
		const response = await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri: REDIRECT_URI,
				client_id: clientId,
				code_verifier: codeVerifier,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("stats - Token exchange failed:", errorData);
			Spicetify.showNotification(`Token exchange failed: ${errorData.error_description || errorData.error}`, true);
			return false;
		}

		const data = await response.json();
		storeTokens(data);

		// Clean up code verifier
		localStorage.removeItem(KEYS.codeVerifier);

		Spicetify.showNotification("Successfully connected to Spotify!", false);
		return true;
	} catch (e) {
		console.error("stats - OAuth callback error:", e);
		Spicetify.showNotification("Failed to complete authorization", true);
		return false;
	}
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<void> {
	const clientId = getConfigValue<string>("oauth-client-id");
	const refreshToken = localStorage.getItem(KEYS.refreshToken);

	if (!clientId || !refreshToken) {
		throw new Error("Missing client ID or refresh token");
	}

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			client_id: clientId,
		}),
	});

	if (!response.ok) {
		throw new Error("Token refresh failed");
	}

	const data = await response.json();
	storeTokens(data);
}

/**
 * Store tokens in localStorage
 */
function storeTokens(data: { access_token: string; refresh_token?: string; expires_in: number }): void {
	localStorage.setItem(KEYS.accessToken, data.access_token);
	if (data.refresh_token) {
		localStorage.setItem(KEYS.refreshToken, data.refresh_token);
	}
	// Store expiry time (current time + expires_in seconds)
	const expiresAt = Date.now() + data.expires_in * 1000;
	localStorage.setItem(KEYS.expiresAt, expiresAt.toString());
}

/**
 * Clear all OAuth tokens (logout)
 */
export function clearTokens(): void {
	localStorage.removeItem(KEYS.accessToken);
	localStorage.removeItem(KEYS.refreshToken);
	localStorage.removeItem(KEYS.expiresAt);
	localStorage.removeItem(KEYS.codeVerifier);
}

/**
 * Get OAuth connection status for display
 */
export function getConnectionStatus(): { connected: boolean; expiresAt?: Date } {
	const accessToken = localStorage.getItem(KEYS.accessToken);
	const expiresAt = localStorage.getItem(KEYS.expiresAt);

	if (!accessToken) {
		return { connected: false };
	}

	return {
		connected: true,
		expiresAt: expiresAt ? new Date(parseInt(expiresAt)) : undefined,
	};
}

/**
 * Make an authenticated API request using OAuth token
 */
export async function oauthFetch<T>(url: string): Promise<T> {
	const token = await getAccessToken();
	if (!token) {
		throw new Error("No valid OAuth token. Please reconnect to Spotify.");
	}

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (response.status === 401) {
		// Token might be invalid, try to refresh
		try {
			await refreshAccessToken();
			const newToken = await getAccessToken();
			if (newToken) {
				const retryResponse = await fetch(url, {
					headers: {
						Authorization: `Bearer ${newToken}`,
					},
				});
				if (!retryResponse.ok) {
					throw new Error(`API request failed: ${retryResponse.status}`);
				}
				return retryResponse.json();
			}
		} catch (e) {
			clearTokens();
			throw new Error("OAuth token expired. Please reconnect to Spotify.");
		}
	}

	if (response.status === 429) {
		// Rate limited - extract retry-after if available
		const retryAfter = response.headers.get("Retry-After");
		throw new Error(`Rate limited. Try again in ${retryAfter || "a few"} seconds.`);
	}

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}

	return response.json();
}
