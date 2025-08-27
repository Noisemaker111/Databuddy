import { chQueryWithMeta, TABLE_NAMES } from '@databuddy/db';
import { Elysia, t } from 'elysia';
import {
	type ApiKeyRow,
	getApiKeyFromHeader,
	hasWebsiteScope,
} from '../lib/api-key';

// SQL Query validation schema
const CustomSQLRequestSchema = t.Object({
	query: t.String({ minLength: 1, maxLength: 5000 }),
	clientId: t.String({ minLength: 1 }),
	parameters: t.Optional(
		t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean()]))
	),
});

type CustomSQLRequestType = {
	query: string;
	clientId: string;
	parameters?: Record<string, string | number | boolean>;
};

const ALLOWED_OPERATIONS = [
	'SELECT',
	'WITH',
	'FROM',
	'WHERE',
	'GROUP BY',
	'ORDER BY',
	'HAVING',
	'LIMIT',
	'OFFSET',
	'JOIN',
	'LEFT JOIN',
	'RIGHT JOIN',
	'INNER JOIN',
	'UNION',
	'UNION ALL',
	'JSONExtract',
	'JSONExtractString',
	'JSONExtractInt',
	'JSONExtractFloat',
	'JSONExtractBool',
	'JSONExtractRaw',
	'CASE',
	'WHEN',
	'THEN',
	'ELSE',
	'END',
	'AS',
	'AND',
	'OR',
	'NOT',
	'IN',
	'EXISTS',
	'BETWEEN',
	'LIKE',
	'ILIKE',
];

const FORBIDDEN_OPERATIONS = [
	'INSERT',
	'UPDATE',
	'DELETE',
	'DROP',
	'CREATE',
	'ALTER',
	'TRUNCATE',
	'REPLACE',
	'MERGE',
	'CALL',
	'EXEC',
	'EXECUTE',
	'DECLARE',
	'SET',
	'USE',
	'SHOW',
	'DESCRIBE',
	'EXPLAIN',
	'ANALYZE',
	'OPTIMIZE',
	'REPAIR',
	'LOCK',
	'UNLOCK',
	'GRANT',
	'REVOKE',
	'COMMIT',
	'ROLLBACK',
	'SAVEPOINT',
	'RELEASE',
	'START TRANSACTION',
	'BEGIN',
	'INFORMATION_SCHEMA',
	'SYSTEM',
	'ADMIN',
	'SUPER',
	'FILE',
	'PROCESS',
	'RELOAD',
	'SHUTDOWN',
	'REFERENCES',
	'INDEX',
	'TRIGGER',
	'EVENT',
	'ROUTINE',
];

const FORBIDDEN_PATTERNS = [
	/\/\*.*?\*\//gi,
	/--.*$/gm,
	/;\s*$/gm,
	/\bOR\s+1\s*=\s*1\b/gi,
	/\bUNION\s+(?:ALL\s+)?SELECT\b/gi,
	/\b(?:CONCAT|CHAR|ASCII|SUBSTRING|MID|LENGTH)\s*\(/gi,
	/\bSLEEP\s*\(/gi,
	/\bBENCHMARK\s*\(/gi,
	/\bLOAD_FILE\s*\(/gi,
	/\bINTO\s+(?:OUTFILE|DUMPFILE)\b/gi,
	/\bEXTRACTVALUE\s*\(/gi,
	/\bUPDATEXML\s*\(/gi,
];

const ALLOWED_TABLES = [
	TABLE_NAMES.events,
	TABLE_NAMES.errors,
	TABLE_NAMES.custom_events,
	TABLE_NAMES.web_vitals,
];

const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

class SQLValidationError extends Error {
	readonly code: string;

	constructor(message: string, code = 'INVALID_SQL') {
		super(message);
		this.name = 'SQLValidationError';
		this.code = code;
	}
}

const TABLE_PATTERN = /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
const SUBQUERY_PATTERN = /\(SELECT.*?\)/gi;

const QuerySecurityValidator = {
	transformPropertiesSyntax(query: string): string {
		// Match properties.X patterns and convert to JSONExtract calls
		const propertiesPattern =
			/\bproperties\.([a-zA-Z_][a-zA-Z0-9_]*(?::(string|int|float|bool|raw))?)\b/gi;

		return query.replace(propertiesPattern, (_match, propertyWithType) => {
			const [propertyName, type] = propertyWithType.split(':');

			switch (type) {
				case 'int':
					return `JSONExtractInt(properties, '${propertyName}')`;
				case 'float':
					return `JSONExtractFloat(properties, '${propertyName}')`;
				case 'bool':
					return `JSONExtractBool(properties, '${propertyName}')`;
				case 'raw':
					return `JSONExtractRaw(properties, '${propertyName}')`;
				default:
					return `JSONExtractString(properties, '${propertyName}')`;
			}
		});
	},

	normalizeSQL(query: string): string {
		return query
			.replace(/\/\*[\s\S]*?\*\//g, '')
			.replace(/--.*$/gm, '')
			.replace(/\s+/g, ' ')
			.trim()
			.toUpperCase();
	},

	validateForbiddenOperations(normalizedQuery: string): void {
		for (const operation of FORBIDDEN_OPERATIONS) {
			if (normalizedQuery.includes(operation)) {
				throw new SQLValidationError(
					`Forbidden operation detected: ${operation}`,
					'FORBIDDEN_OPERATION'
				);
			}
		}

		for (const pattern of FORBIDDEN_PATTERNS) {
			if (pattern.test(normalizedQuery)) {
				throw new SQLValidationError(
					'Query contains forbidden pattern or potential injection attempt',
					'FORBIDDEN_PATTERN'
				);
			}
		}
	},

	validateAllowedTables(normalizedQuery: string): void {
		const matches = normalizedQuery.matchAll(TABLE_PATTERN);

		for (const match of matches) {
			const tableName = match[1]?.toLowerCase();
			if (!tableName) {
				continue;
			}

			if (!ALLOWED_TABLES.includes(tableName)) {
				throw new SQLValidationError(
					`Access to table '${tableName}' is not allowed`,
					'FORBIDDEN_TABLE'
				);
			}
		}
	},

	validateQueryStart(normalizedQuery: string): void {
		const startsWithSelect = normalizedQuery.startsWith('SELECT');
		const startsWithWith = normalizedQuery.startsWith('WITH');
		const hasValidStart = startsWithSelect || startsWithWith;
		if (!hasValidStart) {
			throw new SQLValidationError(
				'Query must start with SELECT or WITH',
				'INVALID_QUERY_START'
			);
		}
	},

	validateQueryComplexity(normalizedQuery: string): void {
		const selectMatches = normalizedQuery.match(/SELECT/g);
		const selectCount = selectMatches ? selectMatches.length : 0;
		if (selectCount > 3) {
			throw new SQLValidationError(
				'Query complexity too high (max 3 SELECT statements allowed)',
				'QUERY_TOO_COMPLEX'
			);
		}

		if (normalizedQuery.includes('UNION')) {
			throw new SQLValidationError(
				'UNION operations are not allowed',
				'UNION_NOT_ALLOWED'
			);
		}
	},

	validateQuerySyntax(normalizedQuery: string): void {
		if (normalizedQuery.includes('/*') || normalizedQuery.includes('--')) {
			throw new SQLValidationError(
				'Comments are not allowed in queries',
				'COMMENTS_NOT_ALLOWED'
			);
		}

		if (normalizedQuery.includes(';')) {
			throw new SQLValidationError(
				'Multiple statements not allowed',
				'MULTIPLE_STATEMENTS_NOT_ALLOWED'
			);
		}

		if (normalizedQuery.includes('\\') || normalizedQuery.includes('%')) {
			throw new SQLValidationError(
				'Escape sequences and URL encoding not allowed',
				'ENCODING_NOT_ALLOWED'
			);
		}
	},

	validateParenthesesBalance(normalizedQuery: string): void {
		let parenCount = 0;
		for (const char of normalizedQuery) {
			if (char === '(') {
				parenCount++;
			}
			if (char === ')') {
				parenCount--;
			}
			if (parenCount < 0) {
				throw new SQLValidationError(
					'Unbalanced parentheses in query',
					'INVALID_SYNTAX'
				);
			}
		}
		if (parenCount !== 0) {
			throw new SQLValidationError(
				'Unbalanced parentheses in query',
				'INVALID_SYNTAX'
			);
		}
	},

	validateQueryStructure(normalizedQuery: string): void {
		this.validateQueryStart(normalizedQuery);
		this.validateQueryComplexity(normalizedQuery);
		this.validateQuerySyntax(normalizedQuery);
		this.validateParenthesesBalance(normalizedQuery);
	},

	validateClientAccess(query: string, clientId: string): string {
		if (!clientId || typeof clientId !== 'string') {
			throw new SQLValidationError('Invalid client ID', 'INVALID_CLIENT_ID');
		}

		if (!CLIENT_ID_PATTERN.test(clientId)) {
			throw new SQLValidationError(
				'Invalid client ID format',
				'INVALID_CLIENT_ID'
			);
		}

		const normalizedQuery = query.trim().toUpperCase();

		// Check if query tries to reference client_id directly (security risk)
		if (
			normalizedQuery.includes('CLIENT_ID') &&
			!normalizedQuery.includes('{CLIENTID:STRING}')
		) {
			throw new SQLValidationError(
				'Query cannot reference client_id directly - use parameterized queries',
				'CLIENT_REFERENCE_FORBIDDEN'
			);
		}

		// Prevent subquery bypasses
		const subqueries = normalizedQuery.match(SUBQUERY_PATTERN) || [];
		for (const subquery of subqueries) {
			if (!subquery.includes('CLIENT_ID = {CLIENTID:STRING}')) {
				throw new SQLValidationError(
					'All subqueries must include client filtering using {clientId:String}',
					'SUBQUERY_BYPASS_ATTEMPT'
				);
			}
		}

		// Use parameterized approach for maximum security
		if (normalizedQuery.startsWith('SELECT')) {
			return `SELECT * FROM (${query}) AS filtered_query WHERE client_id = {clientId:String}`;
		}

		if (normalizedQuery.startsWith('WITH')) {
			if (!normalizedQuery.includes('CLIENT_ID = {CLIENTID:STRING}')) {
				throw new SQLValidationError(
					'WITH queries must include client filtering using {clientId:String}',
					'WITH_QUERY_REQUIRES_CLIENT_FILTER'
				);
			}
			return query;
		}

		throw new SQLValidationError(
			'Unsupported query structure',
			'UNSUPPORTED_QUERY'
		);
	},

	validateAgainstAttackVectors(query: string): void {
		const attackVectors = [
			/'\s*OR\s*'.*?'\s*=\s*'/gi,
			/'\s*OR\s*1\s*=\s*1/gi,
			/'\s*OR\s*'1'\s*=\s*'1/gi,
			/'\s*AND\s*1\s*=\s*1/gi,
			/WAITFOR\s+DELAY/gi,
			/pg_sleep\s*\(/gi,
			/SLEEP\s*\(/gi,
			/\bIF\s*\(/gi,
			/\bCASE\s+WHEN/gi,
			/CAST\s*\(/gi,
			/CONVERT\s*\(/gi,
			/;\s*DROP/gi,
			/;\s*DELETE/gi,
			/;\s*UPDATE/gi,
			/;\s*INSERT/gi,
		];

		for (const vector of attackVectors) {
			if (vector.test(query)) {
				throw new SQLValidationError(
					'Query matches known attack pattern',
					'ATTACK_PATTERN_DETECTED'
				);
			}
		}
	},

	validateAndSecureQuery(query: string, clientId: string): string {
		if (!query || typeof query !== 'string') {
			throw new SQLValidationError(
				'Query must be a non-empty string',
				'INVALID_INPUT'
			);
		}

		if (query.length > 5000) {
			throw new SQLValidationError(
				'Query too long (max 5,000 characters)',
				'QUERY_TOO_LONG'
			);
		}

		QuerySecurityValidator.validateAgainstAttackVectors(query);

		// Transform properties.X syntax to JSONExtract calls before validation
		const transformedQuery =
			QuerySecurityValidator.transformPropertiesSyntax(query);

		const normalizedQuery =
			QuerySecurityValidator.normalizeSQL(transformedQuery);

		QuerySecurityValidator.validateForbiddenOperations(normalizedQuery);
		QuerySecurityValidator.validateQueryStructure(normalizedQuery);
		QuerySecurityValidator.validateAllowedTables(normalizedQuery);

		return QuerySecurityValidator.validateClientAccess(
			transformedQuery,
			clientId
		);
	},
};

interface ClickHouseQueryResult {
	data: Record<string, unknown>[];
	meta?: Array<{ name: string; type: string }>;
	execution_time?: number;
	rows_read?: number;
}

async function executeClickHouseQuery(
	query: string,
	parameters: Record<string, unknown> = {}
): Promise<ClickHouseQueryResult> {
	try {
		console.log('Executing ClickHouse query:', query);
		console.log('With parameters:', parameters);

		const result = await chQueryWithMeta(query, parameters);

		return {
			data: result.data,
			meta: result.meta,
			execution_time: result.statistics?.elapsed || undefined,
			rows_read: result.statistics?.rows_read || undefined,
		};
	} catch (error) {
		console.error('ClickHouse query execution failed:', error);
		throw new Error(
			`ClickHouse query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

function customSQLAuth() {
	return new Elysia()
		.onBeforeHandle(async ({ request, set }) => {
			const apiKey = await getApiKeyFromHeader(request.headers);

			if (!apiKey) {
				set.status = 401;
				return {
					success: false,
					error: 'API key required for custom SQL access',
					code: 'AUTH_REQUIRED',
				};
			}

			if (!apiKey.scopes.includes('admin:apikeys')) {
				set.status = 403;
				return {
					success: false,
					error: 'API key must have admin:apikeys scope for custom SQL access',
					code: 'INSUFFICIENT_SCOPE',
				};
			}

			return;
		})
		.derive(async ({ request }) => {
			const apiKey = await getApiKeyFromHeader(request.headers);
			return {
				apiKey: apiKey as ApiKeyRow,
			};
		});
}

export const customSQL = new Elysia({ prefix: '/v1/custom-sql' })
	.use(customSQLAuth())
	.post(
		'/execute',
		async ({
			body,
			apiKey,
			set,
		}: {
			body: CustomSQLRequestType;
			apiKey: ApiKeyRow;
			set: { status: number };
		}) => {
			try {
				const hasAccess = await hasWebsiteScope(
					apiKey,
					body.clientId,
					'read:data'
				);
				if (!hasAccess) {
					set.status = 403;
					return {
						success: false,
						error: `API key does not have access to client ID: ${body.clientId}`,
						code: 'CLIENT_ACCESS_DENIED',
					};
				}

				const secureQuery = QuerySecurityValidator.validateAndSecureQuery(
					body.query,
					body.clientId
				);

				const queryParameters = {
					clientId: body.clientId,
					...body.parameters,
				};

				const result = await executeClickHouseQuery(
					secureQuery,
					queryParameters
				);

				return {
					success: true,
					data: result.data,
					meta: {
						rowCount: result.data.length,
						columns: result.meta?.map((col) => col.name) || [],
						executionTime: result.execution_time || null,
						rowsRead: result.rows_read || null,
						clientId: body.clientId,
						apiKeyId: apiKey.id,
					},
				};
			} catch (error) {
				console.error('Custom SQL execution failed:', error);

				if (error instanceof SQLValidationError) {
					set.status = 400;
					return {
						success: false,
						error: error.message,
						code: error.code,
					};
				}

				set.status = 500;
				return {
					success: false,
					error:
						error instanceof Error ? error.message : 'Query execution failed',
					code: 'EXECUTION_ERROR',
				};
			}
		},
		{
			body: CustomSQLRequestSchema,
		}
	)
	.get('/schema', () => {
		return {
			success: true,
			schema: {
				allowedTables: ALLOWED_TABLES,
				allowedOperations: ALLOWED_OPERATIONS,
				forbiddenOperations: FORBIDDEN_OPERATIONS,
				maxQueryLength: 5000,
				maxNestedSelects: 3,
				parameterization: {
					clientIdParameter: '{clientId:String}',
					required: 'All queries must use parameterized client filtering',
				},
				propertiesSyntax: {
					description:
						'Automatic JSONExtract transformation from properties.X syntax',
					syntax: 'properties.property_name[:type]',
					supportedTypes: ['string', 'int', 'float', 'bool', 'raw'],
					examples: [
						'properties.browser_name',
						'properties.user_id:int',
						'properties.is_active:bool',
						'properties.metadata:raw',
					],
					defaultType: 'string (JSONExtractString)',
				},
			},
		};
	})
	.get('/examples', () => {
		return {
			success: true,
			examples: [
				{
					name: 'Monthly Events Count',
					description: 'Get monthly event counts for your client',
					query: `
						SELECT
							toStartOfMonth(time) as month_start,
							count() as event_count
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 6 MONTH
						GROUP BY month_start
						ORDER BY month_start DESC
					`.trim(),
				},
				{
					name: 'Top Pages by Views',
					description: 'Get most popular pages',
					query: `
						SELECT
							path,
							count() as page_views,
							uniq(session_id) as unique_sessions
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 30 DAY
							AND event_name = 'page_view'
						GROUP BY path
						ORDER BY page_views DESC
						LIMIT 10
					`.trim(),
				},
				{
					name: 'Browser Analytics (with properties.X syntax)',
					description: 'Analyze browser usage using properties.X syntax',
					query: `
						SELECT
							properties.browser_name,
							count() as events,
							uniq(anonymous_id) as unique_users
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 7 DAY
							AND properties.browser_name IS NOT NULL
						GROUP BY properties.browser_name
						ORDER BY events DESC
					`.trim(),
				},
				{
					name: 'User Analytics with Typed Properties',
					description: 'Analyze user behavior with typed property extraction',
					query: `
						SELECT
							properties.user_id:int as user_id,
							properties.is_premium:bool as is_premium,
							properties.session_duration:float as session_duration,
							count() as total_events
						FROM analytics.events
						WHERE
							time >= now() - INTERVAL 30 DAY
							AND properties.user_id:int IS NOT NULL
						GROUP BY
							properties.user_id:int,
							properties.is_premium:bool,
							properties.session_duration:float
						ORDER BY total_events DESC
						LIMIT 20
					`.trim(),
				},
				{
					name: 'Error Events Analysis',
					description: 'Analyze error events',
					query: `
						SELECT
							url,
							count() as error_count
						FROM analytics.errors
						WHERE
							time >= now() - INTERVAL 7 DAY
						GROUP BY url
						ORDER BY error_count DESC
						LIMIT 10
					`.trim(),
				},
			],
		};
	});
