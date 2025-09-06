'use client';

import { CheckCircleIcon, LinkIcon, PlusIcon, WarningIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntegrations, useDisconnectIntegration, type Integration } from '@/hooks/use-integrations';
import { trpc } from '@/lib/trpc';

const categoryLabels = {
	deployment: 'Deployment',
	analytics: 'Analytics',
	monitoring: 'Monitoring',
	communication: 'Communication',
};

function LoadingSkeleton() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-96" />
			</div>
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-5 w-8" />
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((num) => (
						<Card key={num} className="animate-pulse">
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Skeleton className="h-10 w-10 rounded" />
										<Skeleton className="h-5 w-20" />
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-9 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex h-64 items-center justify-center">
			<div className="text-center">
				<WarningIcon className="mx-auto h-12 w-12 text-destructive" />
				<h3 className="mt-2 font-medium text-foreground text-sm">
					Failed to load integrations
				</h3>
				<p className="mt-1 text-muted-foreground text-sm">
					There was an issue loading your integrations. Please try again.
				</p>
				<Button onClick={onRetry} variant="outline" className="mt-4">
					Try Again
				</Button>
			</div>
		</div>
	);
}

export default function IntegrationsPage() {
	const searchParams = useSearchParams();
	const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const { integrations, isLoading, isError, refetch } = useIntegrations();
	const disconnectMutation = useDisconnectIntegration();

	// Check for success message from OAuth callback
	useEffect(() => {
		if (searchParams.get('vercel_integrated') === 'true') {
			setShowSuccessMessage(true);
			refetch(); // Refresh integrations to show the new connection
			
			// Remove the query parameter from URL
			const url = new URL(window.location.href);
			url.searchParams.delete('vercel_integrated');
			window.history.replaceState({}, '', url.toString());
			
			// Hide success message after 5 seconds
			const timer = setTimeout(() => {
				setShowSuccessMessage(false);
			}, 5000);
			
			return () => clearTimeout(timer);
		}
	}, [searchParams, refetch]);

	const handleConnect = (integration: Integration) => {
		if (integration.id === 'vercel') {
			setConnectingProvider(integration.id);
			
			// Redirect directly to Vercel OAuth
			const clientId = process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID;
			const redirectUri = `${window.location.origin}/api/integrations/vercel/callback`;
			const state = encodeURIComponent(window.location.href);
			
			const vercelAuthUrl = new URL('https://vercel.com/oauth/authorize');
			vercelAuthUrl.searchParams.set('client_id', clientId || '');
			vercelAuthUrl.searchParams.set('redirect_uri', redirectUri);
			vercelAuthUrl.searchParams.set('response_type', 'code');
			vercelAuthUrl.searchParams.set('scope', 'user:read');
			vercelAuthUrl.searchParams.set('state', state);
			
			window.location.href = vercelAuthUrl.toString();
		}
	};

	const handleDisconnect = async (integration: Integration) => {
		try {
			await disconnectMutation.mutateAsync({
				provider: integration.id as 'vercel',
			});
		} catch (error) {
			console.error('Failed to disconnect integration:', error);
		}
	};

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (isError) {
		return <ErrorState onRetry={refetch} />;
	}

	const groupedIntegrations = integrations.reduce((acc, integration) => {
		if (!acc[integration.category]) {
			acc[integration.category] = [];
		}
		acc[integration.category].push(integration);
		return acc;
	}, {} as Record<string, Integration[]>);

	return (
		<div className="space-y-8">
			{showSuccessMessage && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
					<div className="flex items-center gap-3">
						<CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
						<div>
							<h3 className="font-medium text-green-800 dark:text-green-200">
								Integration Connected Successfully
							</h3>
							<p className="text-green-700 text-sm dark:text-green-300">
								Vercel has been connected to your account. You can now manage your deployments.
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowSuccessMessage(false)}
							className="ml-auto text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
						>
							×
						</Button>
					</div>
				</div>
			)}
			
			<div className="space-y-2">
				<h2 className="font-semibold text-2xl tracking-tight">Integrations</h2>
				<p className="text-muted-foreground">
					Connect your favorite tools and services to enhance your workflow.
				</p>
			</div>

			{Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
				<div key={category} className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="font-medium text-lg">{categoryLabels[category as keyof typeof categoryLabels]}</h3>
						<Badge variant="secondary" className="text-xs">
							{categoryIntegrations.length}
						</Badge>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{categoryIntegrations.map((integration) => (
							<Card key={integration.id} className="relative shadow-sm transition-shadow hover:shadow-md">
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded border bg-background p-2">
												<Image
													src={integration.logo}
													alt={`${integration.name} logo`}
													width={24}
													height={24}
													className="h-6 w-6"
												/>
											</div>
											<div>
												<CardTitle className="text-base">{integration.name}</CardTitle>
											</div>
										</div>
										{integration.connected && (
											<Badge variant="default" className="text-xs">
												<LinkIcon className="mr-1 h-3 w-3" />
												Connected
											</Badge>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<CardDescription className="text-sm leading-relaxed">
										{integration.description}
									</CardDescription>
									
									<div className="flex items-center justify-between">
										{integration.connected ? (
											<div className="flex gap-2">
												<Button variant="outline" size="sm" disabled>
													Configure
												</Button>
												<Button 
													variant="ghost" 
													size="sm" 
													className="text-destructive hover:text-destructive"
													onClick={() => handleDisconnect(integration)}
													disabled={disconnectMutation.isPending}
												>
													{disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
												</Button>
											</div>
										) : (
											<Button 
												onClick={() => handleConnect(integration)}
												size="sm"
												className="w-full"
												disabled={connectingProvider === integration.id}
											>
												<PlusIcon className="mr-2 h-4 w-4" />
												{connectingProvider === integration.id ? 'Connecting...' : 'Connect'}
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			))}

			{integrations.length === 0 && (
				<div className="flex h-64 items-center justify-center">
					<div className="text-center">
						<LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 className="mt-2 font-medium text-foreground text-sm">
							No integrations available
						</h3>
						<p className="mt-1 text-muted-foreground text-sm">
							Check back later for new integrations.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
