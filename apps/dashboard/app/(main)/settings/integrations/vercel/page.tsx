'use client';

import {
	CheckCircleIcon,
	RocketLaunchIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import {
	CreateWebsiteDialog,
	type Domain,
	ErrorState,
	LoadingSkeleton,
	type Project,
	ProjectRow,
} from './_components';

export default function VercelConfigPage() {
	const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
		new Set()
	);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [selectedDomains, setSelectedDomains] = useState<Domain[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	const {
		data: debugData,
		isLoading: isLoadingDebug,
		error: debugError,
	} = trpc.vercel.debugAccounts.useQuery();

	const {
		data: connectionTest,
		isLoading: isTestingConnection,
		error: connectionError,
	} = trpc.vercel.testConnection.useQuery(undefined, {
		enabled: !!debugData?.hasVercelAccount,
	});

	const {
		data: projectsData,
		isLoading: isLoadingProjects,
		error: projectsError,
	} = trpc.vercel.getProjects.useQuery(
		{ limit: '20' },
		{ enabled: !!debugData?.hasVercelAccount }
	);

	const toggleProjectExpansion = (projectId: string) => {
		const newExpanded = new Set(expandedProjects);
		if (newExpanded.has(projectId)) {
			newExpanded.delete(projectId);
		} else {
			newExpanded.add(projectId);
		}
		setExpandedProjects(newExpanded);
	};

	const handleCreateWebsite = (domain: Domain) => {
		setSelectedDomains([domain]);
		setSelectedProject(null);
		setIsDialogOpen(true);
	};

	const handleCreateMultipleWebsites = (
		project: Project,
		domains: Domain[]
	) => {
		setSelectedProject(project);
		setSelectedDomains(domains);
		setIsDialogOpen(true);
	};

	const handleSaveWebsites = async (configs: any[]) => {
		setIsCreating(true);
		try {
			console.log('Integrating websites for configs:', configs);
			await new Promise((resolve) => setTimeout(resolve, 2000));
			setIsDialogOpen(false);
			setSelectedDomains([]);
			setSelectedProject(null);
		} catch (error) {
			console.error('Failed to integrate websites:', error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setSelectedDomains([]);
		setSelectedProject(null);
	};

	if (isLoadingDebug || isTestingConnection) {
		return (
			<div className="flex h-full flex-col">
				<div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
					<div className="flex h-24 items-center px-4 sm:px-6">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-4">
								<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
									<RocketLaunchIcon
										className="h-6 w-6 text-primary"
										size={24}
										weight="duotone"
									/>
								</div>
								<div>
									<h1 className="truncate font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
										Vercel Integration
									</h1>
									<p className="mt-1 text-muted-foreground text-sm sm:text-base">
										Connect your Vercel projects to integrate Databuddy websites
									</p>
								</div>
							</div>
						</div>
						<Skeleton className="h-6 w-6 rounded-full" />
					</div>
				</div>

				<main className="flex-1 overflow-y-auto">
					<LoadingSkeleton />
				</main>
			</div>
		);
	}

	if (debugError) {
		return <ErrorState message={`Debug error: ${debugError.message}`} />;
	}

	if (!debugData?.hasVercelAccount) {
		return (
			<div className="space-y-6">
				<div className="space-y-3">
					<h1 className="font-semibold text-2xl">Vercel Configuration</h1>
					<p className="text-muted-foreground">
						Manage your Vercel projects and environment variables
					</p>
				</div>
				<ErrorState message="No Vercel account found. Please connect your Vercel account first from the integrations page." />
				<div className="mt-4 rounded-lg bg-muted p-4">
					<h3 className="mb-2 font-medium">Debug Information:</h3>
					<pre className="text-sm">{JSON.stringify(debugData, null, 2)}</pre>
				</div>
			</div>
		);
	}

	const hasConnectionIssue = connectionError || !connectionTest?.success;

	return (
		<div className="flex h-full flex-col">
			<div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
				<div className="flex h-24 items-center px-4 sm:px-6">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-4">
							<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
								<RocketLaunchIcon
									className="h-6 w-6 text-primary"
									size={24}
									weight="duotone"
								/>
							</div>
							<div>
								<h1 className="truncate font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
									Vercel Integration
								</h1>
								<p className="mt-1 text-muted-foreground text-sm sm:text-base">
									Connect your Vercel projects to integrate Databuddy websites
								</p>
							</div>
						</div>
					</div>
					{hasConnectionIssue ? (
						<WarningIcon className="h-6 w-6 text-yellow-600" />
					) : (
						<CheckCircleIcon className="h-6 w-6 text-green-600" />
					)}
				</div>
			</div>

			<main className="flex-1 overflow-y-auto">
				{hasConnectionIssue && (
					<div className="border-yellow-200 border-b bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/50">
						<div className="flex items-start">
							<WarningIcon className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
							<div className="ml-3">
								<h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
									Connection Warning
								</h3>
								<p className="text-sm text-yellow-700 dark:text-yellow-300">
									{connectionError?.message || 'Connection test failed'}
								</p>
							</div>
						</div>
					</div>
				)}

				<div>
					{isLoadingProjects ? (
						<LoadingSkeleton />
					) : projectsError ? (
						<ErrorState message="Failed to load projects" />
					) : projectsData?.projects?.length ? (
						<div>
							{projectsData.projects.map((project: Project) => (
								<ProjectRow
									isExpanded={expandedProjects.has(project.id)}
									key={project.id}
									onCreateMultipleWebsites={handleCreateMultipleWebsites}
									onCreateWebsite={handleCreateWebsite}
									onToggle={() => toggleProjectExpansion(project.id)}
									project={project}
								/>
							))}
						</div>
					) : (
						<div className="border-b border-dashed p-12 text-center">
							<RocketLaunchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 font-medium">No projects found</h3>
							<p className="mt-2 text-muted-foreground text-sm">
								Add a project in Vercel to see it here.
							</p>
						</div>
					)}
				</div>
			</main>

			<CreateWebsiteDialog
				isOpen={isDialogOpen}
				isSaving={isCreating}
				onClose={handleCloseDialog}
				onSave={handleSaveWebsites}
				selectedDomains={selectedDomains}
				selectedProject={selectedProject}
			/>
		</div>
	);
}
