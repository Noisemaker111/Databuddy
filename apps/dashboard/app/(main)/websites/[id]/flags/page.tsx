"use client";

import { useFlags } from "@databuddy/sdk/react";
import { FlagIcon, InfoIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { FeatureGate } from "@/components/feature-gate";
import { GATED_FEATURES } from "@/components/providers/billing-provider";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { orpc } from "@/lib/orpc";
import { isFlagSheetOpenAtom } from "@/stores/jotai/flagsAtoms";
import { FlagSheet } from "./_components/flag-sheet";
import { FlagsList } from "./_components/flags-list";
import type { Flag } from "./_components/types";

const FlagsListSkeleton = () => (
	<div className="border-border border-t">
		{[...new Array(5)].map((_, i) => (
			<div
				className="flex animate-pulse items-center border-border border-b px-4 py-4 sm:px-6"
				key={`skeleton-${i + 1}`}
			>
				<div className="flex flex-1 items-center gap-4">
					<div className="min-w-0 flex-1 space-y-2">
						<div className="flex items-center gap-2">
							<div className="h-5 w-40 rounded bg-muted" />
							<div className="h-5 w-16 rounded bg-muted" />
							<div className="h-5 w-20 rounded bg-muted" />
						</div>
						<div className="h-4 w-48 rounded bg-muted" />
					</div>
					<div className="h-6 w-10 rounded-full bg-muted" />
					<div className="size-8 rounded bg-muted" />
				</div>
			</div>
		))}
	</div>
);

export default function FlagsPage() {
	const { id } = useParams();
	const websiteId = id as string;
	const [isFlagSheetOpen, setIsFlagSheetOpen] = useAtom(isFlagSheetOpenAtom);
	const [editingFlag, setEditingFlag] = useState<Flag | null>(null);
	const queryClient = useQueryClient();

	const { isEnabled } = useFlags();
	const experimentFlag = isEnabled("experiment-50");

	const { data: flags, isLoading: flagsLoading } = useQuery({
		...orpc.flags.list.queryOptions({ input: { websiteId } }),
	});

	const deleteFlagMutation = useMutation({
		...orpc.flags.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.flags.list.key({ input: { websiteId } }),
			});
		},
	});

	const handleCreateFlag = () => {
		setEditingFlag(null);
		setIsFlagSheetOpen(true);
	};

	const handleEditFlag = (flag: Flag) => {
		setEditingFlag(flag);
		setIsFlagSheetOpen(true);
	};

	const handleDeleteFlag = async (flagId: string) => {
		await deleteFlagMutation.mutateAsync({ id: flagId });
	};

	const handleFlagSheetClose = () => {
		setIsFlagSheetOpen(false);
		setEditingFlag(null);
	};

	return (
		<FeatureGate feature={GATED_FEATURES.FEATURE_FLAGS}>
			<ErrorBoundary>
				<div className="h-full overflow-y-auto">
					{experimentFlag.isReady && flags && (
						<div className="flex h-10 items-center border-border border-b bg-accent px-4">
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2">
									{experimentFlag.enabled ? (
										<FlagIcon
											className="size-4 text-destructive"
											weight="fill"
										/>
									) : (
										<FlagIcon className="size-4 text-blue-600" weight="fill" />
									)}
									{experimentFlag.enabled ? (
										<Badge variant="destructive">Red Team</Badge>
									) : (
										<Badge variant="blue">Blue Team</Badge>
									)}
								</div>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											className="flex items-center gap-1.5 text-foreground text-sm hover:text-foreground/80"
											type="button"
										>
											<InfoIcon className="size-4" weight="duotone" />
											<span className="hidden sm:inline">
												A/B Test Experiment
											</span>
										</button>
									</TooltipTrigger>
									<TooltipContent className="max-w-xs">
										<div className="space-y-2">
											<p className="font-medium">A/B Test Experiment</p>
											<p className="text-xs leading-relaxed">
												This is a proof-of-concept feature flag demonstrating
												A/B testing capabilities. Approximately 50% of users are
												randomly assigned to the "Red Team" experience, while
												the other 50% see the "Blue Team" experience.
											</p>
										</div>
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
					)}

					<Suspense fallback={<FlagsListSkeleton />}>
						<FlagsList
							flags={(flags as Flag[]) ?? []}
							isLoading={flagsLoading}
							onCreateFlagAction={handleCreateFlag}
							onDeleteFlag={handleDeleteFlag}
							onEditFlagAction={handleEditFlag}
						/>
					</Suspense>

					{isFlagSheetOpen && (
						<Suspense fallback={null}>
							<FlagSheet
								flag={editingFlag}
								isOpen={isFlagSheetOpen}
								onCloseAction={handleFlagSheetClose}
								websiteId={websiteId}
							/>
						</Suspense>
					)}
				</div>
			</ErrorBoundary>
		</FeatureGate>
	);
}
