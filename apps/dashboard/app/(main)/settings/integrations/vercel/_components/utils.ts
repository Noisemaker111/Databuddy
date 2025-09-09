import type { Domain } from './types';

export const generateWebsiteName = (domainName: string) => {
	// Return the domain name as-is for the default name
	return domainName;
};

export const generateWebsitePlaceholder = (domainName: string) => {
	// Return the domain name as placeholder
	return domainName;
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
