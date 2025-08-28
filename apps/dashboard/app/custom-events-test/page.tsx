'use client';

import { useState } from 'react';
import {
	executeCustomSQL,
	sendBatchCustomEvents,
	sendCustomEvent,
} from './actions';

const getSQLExamples = () => [
	// Basic analytics queries
	`SELECT
  event_name,
  count() as total_events,
  uniq(anonymous_id) as unique_users,
  uniq(session_id) as unique_sessions
FROM analytics.custom_events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY event_name
ORDER BY total_events DESC`,

	// Properties-based queries
	`SELECT
  properties.source AS source,
  properties.category AS category,
  count() as events,
  uniq(anonymous_id) as users
FROM analytics.custom_events
WHERE
  timestamp >= now() - INTERVAL 30 DAY
  AND properties.source IS NOT NULL
GROUP BY properties.source, properties.category
ORDER BY events DESC
LIMIT 10`,

	// Time-based analysis
	`SELECT
  toStartOfHour(timestamp) as hour,
  event_name,
  count() as events_per_hour
FROM analytics.custom_events
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour, event_name
ORDER BY hour DESC, events_per_hour DESC
LIMIT 20`,

	// Revenue analysis
	`SELECT
  properties.product_id:int as product_id,
  sum(properties.value:float) as total_revenue,
  count() as purchases
FROM analytics.custom_events
WHERE
  timestamp >= now() - INTERVAL 30 DAY
  AND event_name = 'purchase'
  AND properties.value:float > 0
GROUP BY properties.product_id:int
ORDER BY total_revenue DESC
LIMIT 10`,

	// User behavior analysis
	`SELECT
  anonymous_id,
  count() as total_events,
  min(timestamp) as first_event,
  max(timestamp) as last_event
FROM analytics.custom_events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY anonymous_id
HAVING total_events > 5
ORDER BY total_events DESC
LIMIT 20`,

	// "Malicious" but blocked patterns (these should be rejected by the API)
	'SELECT * FROM analytics.custom_events; DROP TABLE analytics.custom_events; --',

	// Another blocked pattern
	'SELECT * FROM analytics.custom_events WHERE 1=1 UNION SELECT * FROM analytics.errors --',

	// Properties syntax abuse (should be handled safely)
	"SELECT JSONExtractInt(properties, 'user_id') as user_id, JSONExtractString(properties, 'password') as password FROM analytics.custom_events",

	// Complex query with CTE
	`WITH user_stats AS (
  SELECT
    anonymous_id,
    count() as event_count,
    min(timestamp) as first_seen
  FROM analytics.custom_events
  WHERE timestamp >= now() - INTERVAL 30 DAY
  GROUP BY anonymous_id
)
SELECT
  us.anonymous_id,
  us.event_count,
  us.first_seen,
  ce.event_name,
  count() as event_type_count
FROM user_stats us
JOIN analytics.custom_events ce ON us.anonymous_id = ce.anonymous_id
WHERE ce.timestamp >= now() - INTERVAL 30 DAY
GROUP BY us.anonymous_id, us.event_count, us.first_seen, ce.event_name
ORDER BY us.event_count DESC, event_type_count DESC
LIMIT 50`,

	// Navigation analytics using properties.section
	`SELECT
  properties.section AS section,
  properties.item AS item,
  count() as clicks,
  uniq(anonymous_id) as unique_users
FROM analytics.custom_events
WHERE 
  event_name = 'navbar-nav-click'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND properties.section IS NOT NULL
GROUP BY properties.section, properties.item
ORDER BY clicks DESC`,

	// Button click analysis with properties
	`SELECT
  properties.button_text AS button_text,
  properties.page_path AS page_path,
  properties.section AS section,
  count() as clicks,
  uniq(session_id) as unique_sessions
FROM analytics.custom_events
WHERE 
  event_name = 'button-click'
  AND timestamp >= now() - INTERVAL 24 HOUR
GROUP BY properties.button_text, properties.page_path, properties.section
ORDER BY clicks DESC
LIMIT 20`,

	// Form interaction tracking
	`SELECT
  properties.form_name AS form_name,
  properties.field_name AS field_name,
  properties.action AS action,
  count() as interactions
FROM analytics.custom_events
WHERE 
  event_name IN ('form-field-focus', 'form-field-blur', 'form-submit')
  AND timestamp >= now() - INTERVAL 3 DAY
  AND properties.form_name IS NOT NULL
GROUP BY properties.form_name, properties.field_name, properties.action
ORDER BY interactions DESC`,

	// Feature usage analysis
	`SELECT
  properties.feature_name AS feature_name,
  properties.user_plan AS user_plan,
  count() as usage_count,
  uniq(anonymous_id) as unique_users,
  countIf(properties.success = 'true') as successful_uses
FROM analytics.custom_events
WHERE 
  event_name = 'feature-used'
  AND timestamp >= now() - INTERVAL 14 DAY
GROUP BY properties.feature_name, properties.user_plan
ORDER BY usage_count DESC`,

	// Search behavior analysis
	`SELECT
  properties.search_term AS search_term,
  properties.search_category AS search_category,
  properties.results_count:int as results_count,
  count() as search_count,
  avg(properties.results_count:int) as avg_results
FROM analytics.custom_events
WHERE 
  event_name = 'search-performed'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND properties.search_term IS NOT NULL
GROUP BY properties.search_term, properties.search_category, properties.results_count:int
HAVING search_count > 1
ORDER BY search_count DESC
LIMIT 25`,
];

export default function CustomEventsTestPage() {
	const generateRandomId = () => Math.random().toString(36).substring(2, 15);
	const generateRandomSessionId = () => `session_${generateRandomId()}`;
	const generateRandomAnonymousId = () => `anon_${generateRandomId()}`;

	const [formData, setFormData] = useState({
		clientId: 'OXmNQsViBT-FOS_wZCTHc',
		apiKey: '',
		name: 'test_event',
		anonymousId: generateRandomAnonymousId(),
		sessionId: generateRandomSessionId(),
		properties: JSON.stringify(
			{
				value: Math.floor(Math.random() * 1000),
				currency: 'USD',
				category: 'test',
				source: 'dashboard',
			},
			null,
			2
		),
	});

	const [batchData, setBatchData] = useState(() =>
		JSON.stringify(
			[
				{
					name: 'purchase',
					anonymousId: generateRandomAnonymousId(),
					sessionId: generateRandomSessionId(),
					timestamp: Date.now(),
					properties: {
						value: Math.floor(Math.random() * 500) + 50,
						currency: 'USD',
						product_id: `prod_${generateRandomId()}`,
						category: 'ecommerce',
					},
				},
				{
					name: 'signup',
					anonymousId: generateRandomAnonymousId(),
					sessionId: generateRandomSessionId(),
					timestamp: Date.now(),
					properties: {
						plan: 'premium',
						source: 'landing_page',
						campaign: 'summer_promo',
					},
				},
				{
					name: 'navbar-nav-click',
					anonymousId: generateRandomAnonymousId(),
					sessionId: generateRandomSessionId(),
					timestamp: Date.now(),
					properties: {
						section: 'main-nav',
						item: 'pricing',
						page_path: '/dashboard',
						user_authenticated: 'true',
					},
				},
				{
					name: 'button-click',
					anonymousId: generateRandomAnonymousId(),
					sessionId: generateRandomSessionId(),
					timestamp: Date.now(),
					properties: {
						button_text: 'Get Started',
						page_path: '/landing',
						section: 'hero',
						button_type: 'cta',
					},
				},
				{
					name: 'search-performed',
					anonymousId: generateRandomAnonymousId(),
					sessionId: generateRandomSessionId(),
					timestamp: Date.now(),
					properties: {
						search_term: 'analytics dashboard',
						search_category: 'features',
						results_count: 12,
						search_duration_ms: 245,
					},
				},
			],
			null,
			2
		)
	);

	const [sqlQuery, setSqlQuery] = useState(`SELECT
  event_name,
  count() as total_events,
  uniq(anonymous_id) as unique_users,
  uniq(session_id) as unique_sessions
FROM analytics.custom_events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY event_name
ORDER BY total_events DESC`);

	const [response, setResponse] = useState<Record<string, unknown> | null>(
		null
	);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'sql'>(
		'single'
	);

	const regenerateRandomData = () => {
		if (activeTab === 'single') {
			setFormData({
				...formData,
				anonymousId: generateRandomAnonymousId(),
				sessionId: generateRandomSessionId(),
				properties: JSON.stringify(
					{
						value: Math.floor(Math.random() * 1000),
						currency: 'USD',
						category: 'test',
						source: 'dashboard',
						timestamp: new Date().toISOString(),
					},
					null,
					2
				),
			});
		} else if (activeTab === 'batch') {
			setBatchData(
				JSON.stringify(
					[
						{
							name: 'purchase',
							anonymousId: generateRandomAnonymousId(),
							sessionId: generateRandomSessionId(),
							timestamp: Date.now(),
							properties: {
								value: Math.floor(Math.random() * 500) + 50,
								currency: 'USD',
								product_id: `prod_${generateRandomId()}`,
								category: 'ecommerce',
							},
						},
						{
							name: 'signup',
							anonymousId: generateRandomAnonymousId(),
							sessionId: generateRandomSessionId(),
							timestamp: Date.now(),
							properties: {
								plan: ['free', 'premium', 'enterprise'][
									Math.floor(Math.random() * 3)
								],
								source: ['landing_page', 'email', 'social'][
									Math.floor(Math.random() * 3)
								],
								campaign: `campaign_${generateRandomId()}`,
							},
						},
					],
					null,
					2
				)
			);
		} else {
			// SQL tab - provide different query examples
			const queries = getSQLExamples();
			setSqlQuery(queries[Math.floor(Math.random() * queries.length)]);
		}
		setResponse(null); // Clear previous response
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			if (activeTab === 'single') {
				const result = await sendCustomEvent({
					clientId: formData.clientId,
					name: formData.name,
					anonymousId: formData.anonymousId || undefined,
					sessionId: formData.sessionId || undefined,
					properties: formData.properties
						? JSON.parse(formData.properties)
						: undefined,
				});
				setResponse(result);
			} else if (activeTab === 'batch') {
				const batchEvents = JSON.parse(batchData);
				const result = await sendBatchCustomEvents(
					formData.clientId,
					batchEvents
				);
				setResponse(result);
			} else {
				const result = await executeCustomSQL({
					clientId: formData.clientId,
					apiKey: formData.apiKey,
					query: sqlQuery,
				});
				setResponse(result);
			}
		} catch (error) {
			setResponse({
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="mb-6 font-bold text-2xl">Custom Events Test</h1>

			{/* Tabs */}
			<div className="mb-6 border-b">
				<div className="flex space-x-4">
					<button
						className={`border-b-2 px-4 py-2 font-medium text-sm ${
							activeTab === 'single'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'
						}`}
						onClick={() => setActiveTab('single')}
						type="button"
					>
						Single Event
					</button>
					<button
						className={`border-b-2 px-4 py-2 font-medium text-sm ${
							activeTab === 'batch'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'
						}`}
						onClick={() => setActiveTab('batch')}
						type="button"
					>
						Batch Events
					</button>
					<button
						className={`border-b-2 px-4 py-2 font-medium text-sm ${
							activeTab === 'sql'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'
						}`}
						onClick={() => setActiveTab('sql')}
						type="button"
					>
						Query Events
					</button>
				</div>
			</div>

			<form className="space-y-4" onSubmit={handleSubmit}>
				<div>
					<label className="mb-1 block font-medium text-sm" htmlFor="clientId">
						Client ID *
					</label>
					<input
						className="w-full rounded border p-2"
						id="clientId"
						onChange={(e) =>
							setFormData({ ...formData, clientId: e.target.value })
						}
						placeholder="web_123"
						required
						type="text"
						value={formData.clientId}
					/>
				</div>

				<div>
					<label className="mb-1 block font-medium text-sm" htmlFor="apiKey">
						API Key {activeTab === 'sql' ? '*' : '(for SQL queries)'}
					</label>
					<input
						className="w-full rounded border p-2 font-mono text-sm"
						id="apiKey"
						onChange={(e) =>
							setFormData({ ...formData, apiKey: e.target.value })
						}
						placeholder="dbdy_your_api_key_here"
						required={activeTab === 'sql'}
						type="password"
						value={formData.apiKey}
					/>
					<p className="mt-1 text-gray-500 text-xs">
						API key is required for custom SQL queries. Get one from your
						dashboard settings.
					</p>
				</div>

				{activeTab === 'single' ? (
					<>
						<div>
							<label className="mb-1 block font-medium text-sm" htmlFor="name">
								Event Name *
							</label>
							<input
								className="w-full rounded border p-2"
								id="name"
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="purchase"
								required
								type="text"
								value={formData.name}
							/>
						</div>

						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="anonymousId"
							>
								Anonymous ID
							</label>
							<input
								className="w-full rounded border p-2"
								id="anonymousId"
								onChange={(e) =>
									setFormData({ ...formData, anonymousId: e.target.value })
								}
								placeholder="anon_user_123"
								type="text"
								value={formData.anonymousId}
							/>
						</div>

						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="sessionId"
							>
								Session ID
							</label>
							<input
								className="w-full rounded border p-2"
								id="sessionId"
								onChange={(e) =>
									setFormData({ ...formData, sessionId: e.target.value })
								}
								placeholder="session_456"
								type="text"
								value={formData.sessionId}
							/>
						</div>

						<div>
							<label
								className="mb-1 block font-medium text-sm"
								htmlFor="properties"
							>
								Properties (JSON)
							</label>
							<textarea
								className="h-24 w-full rounded border p-2"
								id="properties"
								onChange={(e) =>
									setFormData({ ...formData, properties: e.target.value })
								}
								placeholder='{"value": 99.99, "currency": "USD", "product_id": "prod_123"}'
								value={formData.properties}
							/>
						</div>
					</>
				) : activeTab === 'batch' ? (
					<div>
						<label
							className="mb-1 block font-medium text-sm"
							htmlFor="batchEvents"
						>
							Batch Events (JSON Array) *
						</label>
						<textarea
							className="h-64 w-full rounded border p-2 font-mono text-sm"
							id="batchEvents"
							onChange={(e) => setBatchData(e.target.value)}
							placeholder={`[
  {
    "name": "purchase",
    "anonymousId": "anon_user_123",
    "sessionId": "session_456",
    "timestamp": 1704067200000,
    "properties": {
      "value": 99.99,
      "currency": "USD",
      "product_id": "prod_123"
    }
  },
  {
    "name": "signup",
    "anonymousId": "anon_user_124",
    "sessionId": "session_457",
    "properties": {
      "plan": "premium",
      "source": "landing_page"
    }
  }
]`}
							required
							value={batchData}
						/>
					</div>
				) : (
					<div>
						<label
							className="mb-1 block font-medium text-sm"
							htmlFor="sqlQuery"
						>
							Custom SQL Query *
						</label>
						<textarea
							className="h-64 w-full rounded border p-2 font-mono text-sm"
							id="sqlQuery"
							onChange={(e) => setSqlQuery(e.target.value)}
							placeholder={`SELECT
  event_name,
  count() as total_events,
  uniq(anonymous_id) as unique_users
FROM analytics.custom_events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY event_name
ORDER BY total_events DESC`}
							required
							value={sqlQuery}
						/>
					</div>
				)}

				<div className="flex gap-4">
					<button
						className="flex-1 rounded border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
						disabled={loading}
						onClick={regenerateRandomData}
						type="button"
					>
						🔄 Regenerate Random Data
					</button>
					<button
						className="flex-1 rounded bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
						disabled={loading}
						type="submit"
					>
						{loading
							? 'Sending...'
							: activeTab === 'single'
								? 'Send Custom Event'
								: activeTab === 'batch'
									? 'Send Batch Custom Events'
									: 'Execute SQL Query'}
					</button>
				</div>
			</form>

			{response && (
				<div className="mt-6">
					<h2 className="mb-2 font-semibold text-lg">Response:</h2>
					<pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
						{JSON.stringify(response, null, 2)}
					</pre>
				</div>
			)}

			<div className="mt-6 text-gray-600 text-sm">
				{activeTab === 'single' ? (
					<>
						<h3 className="mb-2 font-medium">Single Event API Endpoint:</h3>
						<code className="block rounded bg-gray-100 p-2">
							POST basket.databuddy.cc/?client_id={'{website_id}'}
						</code>

						<h3 className="mt-4 mb-2 font-medium">Example Request:</h3>
						<pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
							{`{
  "type": "custom",
  "name": "purchase",
  "anonymousId": "anon_user_123",
  "sessionId": "session_456",
  "timestamp": 1704067200000,
  "properties": {
    "value": 99.99,
    "currency": "USD",
    "product_id": "prod_123"
  }
}`}
						</pre>
					</>
				) : activeTab === 'batch' ? (
					<>
						<h3 className="mb-2 font-medium">Batch Events API Endpoint:</h3>
						<code className="block rounded bg-gray-100 p-2">
							POST basket.databuddy.cc/batch?client_id={'{website_id}'}
						</code>

						<h3 className="mt-4 mb-2 font-medium">Example Request:</h3>
						<pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
							{`[
  {
    "type": "custom",
    "name": "purchase",
    "anonymousId": "anon_user_123",
    "sessionId": "session_456",
    "timestamp": 1704067200000,
    "properties": {
      "value": 99.99,
      "currency": "USD",
      "product_id": "prod_123"
    }
  },
  {
    "type": "custom",
    "name": "signup",
    "anonymousId": "anon_user_124",
    "sessionId": "session_457",
    "properties": {
      "plan": "premium",
      "source": "landing_page"
    }
  }
]`}
						</pre>
					</>
				) : (
					<>
						<h3 className="mb-2 font-medium">Custom SQL API Endpoint:</h3>
						<code className="block rounded bg-gray-100 p-2">
							POST api.databuddy.cc/v1/custom-sql/execute
						</code>

						<h3 className="mt-4 mb-2 font-medium">Example Request:</h3>
						<pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
							{`{
  "query": "SELECT event_name, count() as total_events FROM analytics.custom_events WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event_name ORDER BY total_events DESC",
  "clientId": "your-client-id"
}`}
						</pre>

						<h3 className="mt-4 mb-2 font-medium">Requirements:</h3>
						<ul className="list-inside list-disc space-y-1 text-xs">
							<li>
								<strong>API Key Required:</strong> Custom SQL queries need
								authentication
							</li>
							<li>
								<strong>Automatic Client Filtering:</strong> The API
								automatically adds client_id filtering based on your API key
								permissions
							</li>
							<li>
								API key must have <code>read:analytics</code> or{' '}
								<code>write:custom-sql</code> scope
							</li>
							<li>
								Queries are automatically filtered by client ID for security
							</li>
						</ul>

						<h3 className="mt-4 mb-2 font-medium">Query Examples:</h3>
						<ul className="list-inside list-disc space-y-1 text-xs">
							<li>
								Use <code>properties.X</code> syntax for JSON property access
							</li>
							<li>Queries must start with SELECT or WITH</li>
							<li>
								Use <code>time</code> column for timestamp filtering
							</li>
							<li>
								Available tables: <code>analytics.custom_events</code>,{' '}
								<code>analytics.events</code>, etc.
							</li>
						</ul>

						<h3 className="mt-4 mb-2 font-medium">Security Testing:</h3>
						<p className="text-gray-600 text-xs">
							The examples include some "malicious" patterns that should be
							blocked by the API's security measures. Try them to see how the
							system protects against SQL injection and unauthorized operations.
						</p>
					</>
				)}
			</div>
		</div>
	);
}
