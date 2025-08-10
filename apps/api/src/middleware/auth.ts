import { auth, type User } from '@databuddy/auth';
import { apikey, apikeyAccess, db } from '@databuddy/db';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { Elysia } from 'elysia';

type ApiScope = InferSelectModel<typeof apikey>['scopes'][number];

export interface ApiKeyAuthContext {
	apikey: InferSelectModel<typeof apikey>;
	scopes: ApiScope[];
	principal: { userId?: string | null; organizationId?: string | null };
}

export interface AuthContext {
	mode: 'session' | 'apiKey' | 'public';
	session?: { user: User } | null;
	apiKey?: ApiKeyAuthContext;
	identifier: string; // for rate limiting and logging
}

export function extractApiKey(headers: Headers): string | null {
	const authHeader = headers.get('authorization');
	const xApiKey = headers.get('x-api-key');

	if (xApiKey && xApiKey.trim().length > 0) {
		return xApiKey.trim();
	}

	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(' ');
	if (parts.length === 2) {
		const scheme = parts[0] ?? '';
		const token = parts[1] ?? '';
		const normalized = scheme.toLowerCase();
		if (normalized === 'bearer' || normalized === 'apikey') {
			return token.trim() || null;
		}
	}
	return null;
}

export async function resolveApiKeyContext(
	key: string
): Promise<ApiKeyAuthContext | null> {
	const found = await db.query.apikey.findFirst({ where: eq(apikey.key, key) });
	if (!found) {
		return null;
	}

	if (!found.enabled) {
		return null;
	}
	if (found.revokedAt != null) {
		return null;
	}
	if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
		return null;
	}

	const accessRows = await db
		.select()
		.from(apikeyAccess)
		.where(eq(apikeyAccess.apikeyId, found.id));

	const effectiveScopes = new Set<ApiScope>();
	for (const s of found.scopes) {
		effectiveScopes.add(s as ApiScope);
	}
	for (const row of accessRows) {
		for (const s of row.scopes) {
			effectiveScopes.add(s as ApiScope);
		}
	}

	return {
		apikey: found,
		scopes: Array.from(effectiveScopes),
		principal: {
			userId: found.userId ?? null,
			organizationId: found.organizationId ?? null,
		},
	};
}

export function createAuthMiddleware() {
	return new Elysia().derive(async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (session?.user) {
			const identifier = session.user.id;
			return {
				auth: {
					mode: 'session',
					session: { user: session.user as User },
					identifier,
				} as AuthContext,
			} as const;
		}

		const key = extractApiKey(request.headers);
		if (key) {
			const apiKeyCtx = await resolveApiKeyContext(key);
			if (apiKeyCtx) {
				const identifier = `apikey:${apiKeyCtx.apikey.id}`;
				return {
					auth: {
						mode: 'apiKey',
						apiKey: apiKeyCtx,
						session: null,
						identifier,
					} as AuthContext,
				} as const;
			}
		}

		return {
			auth: {
				mode: 'public',
				session: null,
				identifier: 'anonymous',
			} as AuthContext,
		} as const;
	});
}

export function hasRequiredScopes(
	scopes: ApiScope[],
	required: ApiScope[]
): boolean {
	if (!required.length) {
		return true;
	}
	const set = new Set(scopes);
	for (const req of required) {
		if (!set.has(req)) {
			return false;
		}
	}
	return true;
}

export async function resolveResourceScopes(
	apiKeyId: string,
	resourceType: 'global' | 'website' | 'ab_experiment' | 'feature_flag',
	resourceId?: string | null
): Promise<ApiScope[]> {
	const key = await db.query.apikey.findFirst({
		where: eq(apikey.id, apiKeyId),
	});
	if (!key) {
		return [];
	}
	const entries = await db
		.select()
		.from(apikeyAccess)
		.where(eq(apikeyAccess.apikeyId, apiKeyId));
	const effective = new Set<ApiScope>();
	for (const s of key.scopes) {
		effective.add(s as ApiScope);
	}
	for (const e of entries) {
		const match =
			e.resourceType === 'global' ||
			(e.resourceType === resourceType &&
				(resourceId ?? null) === (e.resourceId ?? null));
		if (match) {
			for (const s of e.scopes) {
				effective.add(s as ApiScope);
			}
		}
	}
	return Array.from(effective);
}
