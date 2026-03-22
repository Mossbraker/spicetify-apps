/** Default initial backoff delay in milliseconds */
export const INITIAL_BACKOFF_MS = 1000;

/** Maximum backoff delay in milliseconds */
export const MAX_BACKOFF_MS = 30_000;

/** Default maximum number of retry attempts */
export const MAX_RETRIES = 3;

/** Default multiplier for exponential backoff */
export const BACKOFF_MULTIPLIER = 2;

export type RetryConfig = {
	maxRetries?: number;
	initialBackoffMs?: number;
	maxBackoffMs?: number;
	backoffMultiplier?: number;
	logger?: { info: (msg: string) => void; warn: (msg: string) => void };
};

const DEFAULT_CONFIG: Required<Omit<RetryConfig, "logger">> = {
	maxRetries: MAX_RETRIES,
	initialBackoffMs: INITIAL_BACKOFF_MS,
	maxBackoffMs: MAX_BACKOFF_MS,
	backoffMultiplier: BACKOFF_MULTIPLIER,
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with automatic retry and exponential backoff.
 * Respects the Retry-After header on 429 responses.
 *
 * Non-429 error responses are returned (not thrown) so callers
 * can inspect the status code themselves.  Only network-level
 * failures are retried transparently.
 */
export async function fetchWithRetry(
	url: string,
	options: RequestInit = {},
	config?: RetryConfig,
): Promise<Response> {
	const { maxRetries, initialBackoffMs, maxBackoffMs, backoffMultiplier } = {
		...DEFAULT_CONFIG,
		...config,
	};
	const logger = config?.logger;

	let lastError: Error | undefined;
	let backoffMs = initialBackoffMs;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetch(url, options);

			if (response.status === 429 && attempt < maxRetries) {
				const retryAfterHeader = response.headers.get("Retry-After");
				const parsed = retryAfterHeader != null ? Number(retryAfterHeader) : NaN;
				const retryAfterMs = Number.isFinite(parsed) ? parsed * 1000 : backoffMs;
				const waitMs = Math.min(retryAfterMs, maxBackoffMs);

				logger?.warn(
					`fetchWithRetry: 429 rate limited, backing off (url=${url}, attempt=${attempt + 1}/${maxRetries}, waitMs=${waitMs})`,
				);

				await wait(waitMs);
				backoffMs = Math.min(backoffMs * backoffMultiplier, maxBackoffMs);
				continue;
			}

			return response;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < maxRetries) {
				logger?.warn(
					`fetchWithRetry: network error, backing off (url=${url}, attempt=${attempt + 1}/${maxRetries}, backoffMs=${backoffMs}, error=${lastError.message})`,
				);

				await wait(backoffMs);
				backoffMs = Math.min(backoffMs * backoffMultiplier, maxBackoffMs);
				continue;
			}
		}
	}

	throw lastError ?? new Error(`fetchWithRetry: all ${maxRetries + 1} attempts failed for ${url}`);
}
