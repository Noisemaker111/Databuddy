import {
	ArrowsOutSimpleIcon,
	MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';

interface TableToolbarProps {
	title: string;
	description?: string;
	showSearch?: boolean;
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	showFullScreen?: boolean;
	onFullScreenToggle?: () => void;
}

export function TableToolbar({
	title,
	description,
	showSearch = true,
	globalFilter,
	onGlobalFilterChange,
	showFullScreen = true,
	onFullScreenToggle,
}: TableToolbarProps) {
	return (
		<div className="px-3 pt-3 pb-2">
			<div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold text-sidebar-foreground text-sm">
						{title}
					</h3>
					{description && (
						<p className="mt-0.5 line-clamp-2 text-sidebar-foreground/70 text-xs">
							{description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					{showSearch && (
						<div className="relative w-full flex-shrink-0 sm:w-auto">
							<MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-2 h-3 w-3 transform text-sidebar-foreground/50" />
							<Input
								aria-label={`Search ${title}`}
								className="h-8 w-full border-sidebar-border bg-sidebar-accent/30 pr-2 pl-7 text-sidebar-foreground text-xs sm:w-36"
								onChange={(event) => onGlobalFilterChange(event.target.value)}
								placeholder="Filter data..."
								value={globalFilter ?? ''}
							/>
						</div>
					)}
					{showFullScreen && onFullScreenToggle && (
						<button
							aria-label="Full screen"
							className="flex h-8 w-8 items-center justify-center rounded border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
							onClick={onFullScreenToggle}
							title="Full screen"
							type="button"
						>
							<ArrowsOutSimpleIcon size={16} />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
