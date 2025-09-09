import type { Domain } from './types';

export const generateWebsiteName = (domainName: string) => {
	const cleanDomain = domainName.replace(
		/\.(com|org|net|io|co|dev|app|vercel\.app)$/,
		''
	);
	return cleanDomain
		.split('.')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
};

export const inferTargetFromDomain = (domain: Domain): string[] => {
	const name = domain.name.toLowerCase();

	if (name.endsWith('.vercel.app')) {
		return ['preview'];
	}

	if (domain.customEnvironmentId) {
		return ['preview', 'development'];
	}

	if (
		name.includes('staging') ||
		name.includes('stage') ||
		name.includes('dev') ||
		name.includes('preview') ||
		name.includes('test')
	) {
		return ['preview', 'development'];
	}

	if (
		domain.gitBranch &&
		domain.gitBranch !== 'main' &&
		domain.gitBranch !== 'master'
	) {
		return ['preview'];
	}

	if (!(name.endsWith('.vercel.app') || domain.customEnvironmentId)) {
		return ['production'];
	}

	return ['production'];
};
