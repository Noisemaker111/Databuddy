'use client';

import {
	ChartLineIcon,
	ClockIcon,
	DatabaseIcon,
	PlugIcon,
	SpinnerIcon,
	TableIcon,
} from '@phosphor-icons/react';
import { use } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { trpc } from '@/lib/trpc';

interface DatabasePageProps {
	params: Promise<{ id: string }>;
}

export default function DatabasePage({ params }: DatabasePageProps) {
	const resolvedParams = use(params);
	const connectionId = resolvedParams.id;

	// Get connection details
	const {
		data: connection,
		isLoading: isLoadingConnection,
		error: connectionError,
	} = trpc.dbConnections.getById.useQuery({ id: connectionId });

	// Get database stats
	const {
		data: databaseStats,
		isLoading: isLoadingStats,
		error: statsError,
	} = trpc.dbConnections.getDatabaseStats.useQuery(
		{ id: connectionId },
		{ enabled: !!connection }
	);

	// Get table stats
	const {
		data: tableStats,
		isLoading: isLoadingTables,
		error: tablesError,
	} = trpc.dbConnections.getTableStats.useQuery(
		{ id: connectionId },
		{ enabled: !!connection }
	);

	if (connectionError) {
		return (
			<div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6">
				<Card className="rounded">
					<CardContent className="pt-6">
						<div className="flex items-center gap-3 text-destructive">
							<DatabaseIcon className="h-5 w-5" weight="duotone" />
							<p className="font-medium">Failed to load database connection</p>
						</div>
						<p className="mt-2 text-muted-foreground text-sm">
							{connectionError.message}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoadingConnection) {
		return (
			<div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6">
				<Card className="rounded">
					<CardContent className="flex items-center justify-center py-12">
						<div className="flex items-center gap-2 text-muted-foreground">
							<SpinnerIcon className="h-4 w-4 animate-spin" />
							<span>Loading database connection...</span>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!connection) {
		return (
			<div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-6">
				<Card className="rounded">
					<CardContent className="pt-6">
						<div className="text-center text-muted-foreground">
							<DatabaseIcon
								className="mx-auto mb-4 h-12 w-12"
								weight="duotone"
							/>
							<p className="font-medium">Database connection not found</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="mx-auto mt-6 max-w-[1600px] space-y-6 p-3 sm:p-4 lg:p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center rounded bg-primary/10 p-2">
							<DatabaseIcon className="h-6 w-6 text-primary" weight="duotone" />
						</div>
						<div className="flex items-center gap-3">
							<h1 className="font-semibold text-2xl">{connection.name}</h1>
							<Badge className="rounded" variant="secondary">
								{connection.type.toUpperCase()}
							</Badge>
							<Badge
								className="rounded border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
								variant="outline"
							>
								<div className="mr-1 h-2 w-2 rounded-full bg-green-500" />
								Connected
							</Badge>
						</div>
					</div>
					<p className="text-muted-foreground text-sm">
						Database monitoring and performance metrics
					</p>
				</div>
			</div>

			{/* Database Stats */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<DatabaseIcon
						className="h-5 w-5 text-muted-foreground"
						weight="duotone"
					/>
					<h2 className="font-semibold text-lg">Database Overview</h2>
				</div>

				{isLoadingStats ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div className="h-20 animate-pulse rounded bg-muted" key={i} />
						))}
					</div>
				) : statsError ? (
					<div className="py-8 text-center text-muted-foreground">
						<p className="font-medium text-destructive">
							Failed to load database stats
						</p>
						<p className="mt-1 text-sm">{statsError.message}</p>
					</div>
				) : databaseStats ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card className="rounded p-4">
							<div className="flex items-center gap-3">
								<div className="rounded bg-muted p-2">
									<DatabaseIcon
										className="h-4 w-4 text-muted-foreground"
										weight="duotone"
									/>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										Database Size
									</p>
									<p className="font-semibold text-xl">
										{databaseStats.databaseSize}
									</p>
								</div>
							</div>
						</Card>

						<Card className="rounded p-4">
							<div className="flex items-center gap-3">
								<div className="rounded bg-muted p-2">
									<PlugIcon
										className="h-4 w-4 text-muted-foreground"
										weight="duotone"
									/>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										Active Connections
									</p>
									<div className="flex items-baseline gap-2">
										<p className="font-semibold text-xl">
											{databaseStats.activeConnections}
										</p>
										<span className="text-muted-foreground text-sm">
											/ {databaseStats.maxConnections}
										</span>
									</div>
								</div>
							</div>
						</Card>

						<Card className="rounded p-4">
							<div className="flex items-center gap-3">
								<div className="rounded bg-muted p-2">
									<ChartLineIcon
										className="h-4 w-4 text-muted-foreground"
										weight="duotone"
									/>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										Cache Hit Ratio
									</p>
									<p className="font-semibold text-xl">
										{databaseStats.hitRatio.toFixed(1)}%
									</p>
								</div>
							</div>
						</Card>

						<Card className="rounded p-4">
							<div className="flex items-center gap-3">
								<div className="rounded bg-muted p-2">
									<ClockIcon
										className="h-4 w-4 text-muted-foreground"
										weight="duotone"
									/>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										Total Queries
									</p>
									<p className="font-semibold text-xl">
										{databaseStats.totalQueries.toLocaleString()}
									</p>
								</div>
							</div>
						</Card>
					</div>
				) : (
					<div className="py-8 text-center text-muted-foreground">
						<p>No database statistics available</p>
					</div>
				)}
			</div>

			{/* Table Stats */}
			<Card className="rounded">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div className="flex items-center gap-2">
						<TableIcon
							className="h-5 w-5 text-muted-foreground"
							weight="duotone"
						/>
						<CardTitle>Table Statistics</CardTitle>
					</div>
					{tableStats && tableStats.length > 0 && (
						<Badge className="rounded" variant="secondary">
							{tableStats.length} tables
						</Badge>
					)}
				</CardHeader>
				<CardContent className="p-0">
					{isLoadingTables ? (
						<div className="flex items-center justify-center py-12">
							<div className="flex items-center gap-2 text-muted-foreground">
								<SpinnerIcon className="h-4 w-4 animate-spin" />
								<span>Loading table statistics...</span>
							</div>
						</div>
					) : tablesError ? (
						<div className="py-12 text-center">
							<p className="font-medium text-destructive">
								Failed to load table stats
							</p>
							<p className="mt-1 text-muted-foreground text-sm">
								{tablesError.message}
							</p>
						</div>
					) : tableStats && tableStats.length > 0 ? (
						<div className="space-y-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Table</TableHead>
										<TableHead>Schema</TableHead>
										<TableHead className="text-right">Rows</TableHead>
										<TableHead className="text-right">Size</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tableStats.slice(0, 10).map((table) => (
										<TableRow key={`${table.schemaName}-${table.tableName}`}>
											<TableCell className="font-medium">
												{table.tableName}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{table.schemaName}
											</TableCell>
											<TableCell className="text-right">
												{table.rowCount?.toLocaleString() || '-'}
											</TableCell>
											<TableCell className="text-right">
												{table.totalSize || '-'}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{tableStats.length > 10 && (
								<div className="border-border border-t bg-muted/50 p-4 text-center">
									<p className="text-muted-foreground text-sm">
										Showing top 10 tables of {tableStats.length} total
									</p>
								</div>
							)}
						</div>
					) : (
						<div className="py-12 text-center text-muted-foreground">
							<TableIcon className="mx-auto mb-2 h-8 w-8" weight="duotone" />
							<p>No table statistics available</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
