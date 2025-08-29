'use server';

interface CustomEventData {
	clientId: string;
	name: string;
	anonymousId?: string;
	sessionId?: string;
	timestamp?: number;
	properties?: JSON;
}

export async function sendCustomEvent(data: CustomEventData) {
	try {
		const payload = {
			type: 'custom',
			name: data.name,
			...(data.anonymousId && { anonymousId: data.anonymousId }),
			...(data.sessionId && { sessionId: data.sessionId }),
			...(data.timestamp && { timestamp: data.timestamp }),
			...(data.properties && { properties: data.properties }),
		};

		const response = await fetch(
			`https://basket.databuddy.cc/?client_id=${data.clientId}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}
		);

		const result = await response.json();

		if (!response.ok) {
			throw new Error(
				result.message || `HTTP ${response.status}: ${response.statusText}`
			);
		}

		return result;
	} catch (error) {
		console.error('Failed to send custom event:', error);
		throw error;
	}
}

export async function sendBatchCustomEvents(
	clientId: string,
	events: CustomEventData[]
) {
	try {
		const payload = events.map((event) => ({
			type: 'custom',
			name: event.name,
			...(event.anonymousId && { anonymousId: event.anonymousId }),
			...(event.sessionId && { sessionId: event.sessionId }),
			...(event.timestamp && { timestamp: event.timestamp }),
			...(event.properties && { properties: event.properties }),
		}));

		const response = await fetch(
			`https://basket.databuddy.cc/batch?client_id=${clientId}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}
		);

		const result = await response.json();

		if (!response.ok) {
			throw new Error(
				result.message || `HTTP ${response.status}: ${response.statusText}`
			);
		}

		return result;
	} catch (error) {
		console.error('Failed to send batch custom events:', error);
		throw error;
	}
}

export async function executeCustomSQL(data: {
	clientId: string;
	apiKey: string;
	query: string;
	parameters?: Record<string, string | number | boolean>;
}) {
	try {
		const payload = {
			query: data.query,
			clientId: data.clientId,
			...(data.parameters && { parameters: data.parameters }),
		};

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (data.apiKey) {
			headers['x-api-key'] = data.apiKey;
		}

		console.log('Sending Custom SQL Request:', {
			url: 'http://localhost:3001/v1/custom-sql/execute',
			payload,
			headers: {
				...headers,
				'x-api-key': data.apiKey ? '[REDACTED]' : undefined,
			},
		});

		const response = await fetch(
			'http://localhost:3001/v1/custom-sql/execute',
			{
				method: 'POST',
				headers,
				body: JSON.stringify(payload),
			}
		);

		const result = await response.json();

		console.log('Custom SQL Response:', {
			status: response.status,
			ok: response.ok,
			result,
		});

		if (!response.ok) {
			// Handle structured error responses with suggestions
			if (result.error && result.code) {
				const errorMessage = result.suggestion
					? `${result.error}\n\n💡 Suggestion: ${result.suggestion}`
					: result.error;
				const error = new Error(errorMessage);
				(error as any).code = result.code;
				(error as any).suggestion = result.suggestion;
				throw error;
			}

			throw new Error(
				result.message ||
					result.error ||
					`HTTP ${response.status}: ${response.statusText}`
			);
		}

		return result;
	} catch (error) {
		console.error('Failed to execute custom SQL:', error);
		throw error;
	}
}

// Add function to send API request events (like the user's example)
export async function sendAPIRequestEvent(data: {
	clientId: string;
	projectId?: string;
	elementId?: string;
	type?: string;
	workspaceId?: string;
	deniedReason?: string;
	apiCallName?: string;
	languageCode?: string;
	namespaceId?: string;
	responseSize?: number;
	success?: boolean;
	timestamp?: number;
}) {
	try {
		const payload = {
			type: 'custom',
			name: 'api_request',
			properties: {
				projectId: data.projectId,
				elementId: data.elementId,
				type: data.type,
				workspaceId: data.workspaceId,
				deniedReason: data.deniedReason || null,
				timestamp: data.timestamp || Date.now(),
				apiCallName: data.apiCallName || null,
				languageCode: data.languageCode || null,
				namespaceId: data.namespaceId || null,
				responseSize: data.responseSize || null,
				success: data.success ?? !data.deniedReason,
			},
			timestamp: new Date(data.timestamp ? data.timestamp * 1000 : Date.now()),
		};

		console.log('Sending API Request Event:', {
			url: `https://basket.databuddy.cc/?client_id=${data.clientId}`,
			payload,
		});

		const response = await fetch(
			`https://basket.databuddy.cc/?client_id=${data.clientId}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}
		);

		const result = await response.json();

		console.log('API Request Event Response:', {
			status: response.status,
			ok: response.ok,
			result,
		});

		if (!response.ok) {
			throw new Error(
				result.message || `HTTP ${response.status}: ${response.statusText}`
			);
		}

		return result;
	} catch (error) {
		console.error('Failed to send API request event:', error);
		throw error;
	}
}
