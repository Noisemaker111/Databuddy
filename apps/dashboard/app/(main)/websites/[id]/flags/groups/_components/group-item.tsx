"use client";

import {
	DotsThreeIcon,
	EnvelopeIcon,
	PencilSimpleIcon,
	TrashIcon,
	UserIcon,
	UsersThreeIcon,
	WrenchIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TargetGroup } from "../../_components/types";

export interface GroupItemProps {
	group: TargetGroup;
	onEdit: (group: TargetGroup) => void;
	onDelete: (groupId: string) => void;
	isSelected?: boolean;
	onSelect?: () => void;
}

function getRuleIcon(type: string) {
	switch (type) {
		case "email":
			return EnvelopeIcon;
		case "user_id":
			return UserIcon;
		default:
			return WrenchIcon;
	}
}

function getRuleTypeLabel(type: string) {
	switch (type) {
		case "email":
			return "emails";
		case "user_id":
			return "users";
		case "property":
			return "properties";
		default:
			return "rules";
	}
}

export function GroupItem({
	group,
	onEdit,
	onDelete,
	isSelected,
	onSelect,
}: GroupItemProps) {
	const ruleCount = group.rules?.length ?? 0;

	const ruleSummary = group.rules?.reduce(
		(acc, rule) => {
			acc[rule.type] = (acc[rule.type] ?? 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"group relative overflow-hidden rounded border bg-card transition-all hover:border-border/80 hover:shadow-lg",
				isSelected && "ring-2 ring-primary ring-offset-2"
			)}
			initial={{ opacity: 0, y: 10 }}
			layout
			whileHover={{ y: -2 }}
		>
			{/* Color accent bar with gradient */}
			<div
				className="absolute inset-x-0 top-0 h-1"
				style={{
					background: `linear-gradient(90deg, ${group.color} 0%, ${group.color}88 50%, ${group.color} 100%)`,
				}}
			/>

			{/* Subtle background glow */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
				style={{
					background: `radial-gradient(ellipse at top, ${group.color} 0%, transparent 70%)`,
				}}
			/>

			{/* Main content */}
			<button
				className="w-full cursor-pointer p-4 pt-5 text-left"
				onClick={() => (onSelect ? onSelect() : onEdit(group))}
				type="button"
			>
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<div
								className="flex size-8 shrink-0 items-center justify-center rounded"
								style={{ backgroundColor: `${group.color}20` }}
							>
								<UsersThreeIcon
									className="size-4"
									style={{ color: group.color }}
									weight="duotone"
								/>
							</div>
							<h3 className="truncate font-semibold text-foreground">
								{group.name}
							</h3>
						</div>

						{group.description && (
							<p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
								{group.description}
							</p>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
								onClick={(e) => e.stopPropagation()}
								size="icon"
								variant="ghost"
							>
								<DotsThreeIcon className="size-5" weight="bold" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem onClick={() => onEdit(group)}>
								<PencilSimpleIcon className="size-4" weight="duotone" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => onDelete(group.id)}
							>
								<TrashIcon className="size-4" weight="duotone" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Rule stats */}
				<div className="mt-4 flex flex-wrap items-center gap-2">
					{ruleCount === 0 ? (
						<span className="text-muted-foreground text-xs">
							No rules defined
						</span>
					) : (
						Object.entries(ruleSummary ?? {}).map(([type, count]) => {
							const RuleIcon = getRuleIcon(type);
							return (
								<Badge className="gap-1.5" key={type} variant="gray">
									<RuleIcon className="size-3" weight="duotone" />
									<span className="tabular-nums">{count}</span>
									<span className="text-muted-foreground">
										{getRuleTypeLabel(type)}
									</span>
								</Badge>
							);
						})
					)}
				</div>

				{/* Member count indicator */}
				{group.memberCount !== undefined && group.memberCount > 0 && (
					<div className="mt-3 flex items-center gap-1.5 text-muted-foreground text-xs">
						<div
							className="size-2 rounded-full"
							style={{ backgroundColor: group.color }}
						/>
						<span className="tabular-nums">{group.memberCount}</span>
						<span>member{group.memberCount !== 1 ? "s" : ""} targeted</span>
					</div>
				)}
			</button>
		</motion.div>
	);
}
