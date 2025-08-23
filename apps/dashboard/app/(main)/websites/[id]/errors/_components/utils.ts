import type { ErrorCategory } from '@databuddy/shared';
import dayjs from 'dayjs';

export const parseDate = (dateString: string): Date => {
	if (!dateString) {
		return new Date();
	}

	let date = dayjs(dateString);
	if (date.isValid()) {
		return date.toDate();
	}

	const isoString = dateString.replace(' ', 'T');
	date = dayjs(isoString);
	if (date.isValid()) {
		return date.toDate();
	}

	date = dayjs(new Date(dateString));
	if (date.isValid()) {
		return date.toDate();
	}

	console.warn('Failed to parse date:', dateString);
	return new Date();
};

export const formatDate = (
	dateString: string,
	formatString: string
): string => {
	try {
		const date = parseDate(dateString);
		return dayjs(date).format(formatString);
	} catch (error) {
		console.warn('Failed to format date:', dateString, error);
		return dateString;
	}
};

export const getErrorCategory = (errorMessage: string): ErrorCategory => {
	if (!errorMessage) {
		return { type: 'Unknown Error', category: 'Other', severity: 'low' };
	}

	const message = errorMessage.toLowerCase();

	if (message.includes('react error')) {
		return { type: 'React Error', category: 'React', severity: 'high' };
	}
	if (message.includes('script error')) {
		return { type: 'Script Error', category: 'JavaScript', severity: 'medium' };
	}
	if (message.includes('network')) {
		return { type: 'Network Error', category: 'Network', severity: 'medium' };
	}
	if (message.includes('syntax')) {
		return { type: 'Syntax Error', category: 'JavaScript', severity: 'high' };
	}
	if (message.includes('reference')) {
		return {
			type: 'Reference Error',
			category: 'JavaScript',
			severity: 'high',
		};
	}
	if (message.includes('type')) {
		return { type: 'Type Error', category: 'JavaScript', severity: 'medium' };
	}

	return { type: 'Unknown Error', category: 'Other', severity: 'low' };
};

export const getSeverityColor = (
	severity: 'high' | 'medium' | 'low'
): string => {
	const colors = {
		high: 'bg-red-100 text-red-800 border-red-200',
		medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
		low: 'bg-blue-100 text-blue-800 border-blue-200',
	};
	return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
};
