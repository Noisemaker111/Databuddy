import type { StreamingUpdate } from '@databuddy/shared';
import type { z } from 'zod';
import type { AIResponseJsonSchema } from '../prompts/agent';
import { executeQuery } from '../utils/query-executor';
import { validateSQL } from '../utils/sql-validator';

export async function handleMetricResponse(
	parsedAiJson: z.infer<typeof AIResponseJsonSchema>
): Promise<StreamingUpdate> {
	if (parsedAiJson.sql) {
		if (!validateSQL(parsedAiJson.sql)) {
			return {
				type: 'error',
				content: 'Generated query failed security validation.',
			};
		}

		try {
			const queryResult = await executeQuery(parsedAiJson.sql);
			const metricValue = extractMetricValue(
				queryResult.data,
				parsedAiJson.metric_value
			);
			return sendMetricResponse(parsedAiJson, metricValue);
		} catch {
			return sendMetricResponse(parsedAiJson, parsedAiJson.metric_value);
		}
	} else {
		return sendMetricResponse(parsedAiJson, parsedAiJson.metric_value);
	}
}

function extractMetricValue(
	queryData: unknown[],
	defaultValue: unknown
): unknown {
	if (!(queryData.length && queryData[0])) {
		return defaultValue;
	}

	const firstRow = queryData[0] as Record<string, unknown>;
	const valueKey =
		Object.keys(firstRow).find((key) => typeof firstRow[key] === 'number') ||
		Object.keys(firstRow)[0];

	return valueKey ? firstRow[valueKey] : defaultValue;
}

function generateTextResponseWithActualValue(
	textResponse: string | undefined,
	actualValue: unknown,
	metricLabel: string | undefined
): string {
	if (!textResponse) {
		const formattedValue =
			typeof actualValue === 'number'
				? actualValue.toLocaleString()
				: actualValue;
		return `${metricLabel || 'Result'}: ${String(formattedValue)}`;
	}

	// If we have a number value, try to replace any number in the text response
	if (typeof actualValue === 'number') {
		// Round to reasonable precision for display
		const roundedValue = Math.round(actualValue * 100) / 100;
		const formattedValue = roundedValue.toLocaleString();

		// Replace any standalone numbers (with optional decimals) with the actual value
		// This pattern matches numbers but avoids replacing numbers within words
		const numberPattern = /\b\d+(?:\.\d+)?\b/g;

		// Check if the text contains numbers that might be the AI's estimate
		const numbersInText = textResponse.match(numberPattern);
		if (numbersInText && numbersInText.length > 0) {
			// Replace only the first number found with our actual value
			// This assumes the main metric is the first number in the sentence
			let hasReplaced = false;
			return textResponse.replace(numberPattern, (match) => {
				if (!hasReplaced) {
					hasReplaced = true;
					return formattedValue;
				}
				return match; // Keep other numbers unchanged
			});
		}
	}

	// If no number replacement needed, return original text
	return textResponse;
}

function sendMetricResponse(
	parsedAiJson: z.infer<typeof AIResponseJsonSchema>,
	metricValue: unknown
): StreamingUpdate {
	const textResponse = generateTextResponseWithActualValue(
		parsedAiJson.text_response,
		metricValue,
		parsedAiJson.metric_label
	);

	const typedMetricValue =
		typeof metricValue === 'string' ||
		typeof metricValue === 'number' ||
		metricValue === undefined
			? metricValue
			: String(metricValue);

	return {
		type: 'complete',
		content: textResponse,
		data: {
			hasVisualization: false,
			responseType: 'metric',
			metricValue: typedMetricValue,
			metricLabel: parsedAiJson.metric_label,
		},
	};
}
