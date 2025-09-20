import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { TableContent } from './table-content';
import { TableTabs } from './table-tabs';

interface TabConfig<TData> {
	id: string;
	label: string;
	data: TData[];
	columns: any[];
	getFilter?: (row: TData) => { field: string; value: string };
}

interface FullScreenModalProps<TData extends { name: string | number }> {
	table: Table<TData>;
	title?: string;
	description?: string;
	onClose: () => void;
	showSearch?: boolean;
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	tabs?: TabConfig<TData>[];
	activeTab?: string;
	onTabChange?: (tabId: string) => void;
	expandable?: boolean;
	getSubRows?: (row: TData) => TData[] | undefined;
	renderSubRow?: (
		subRow: TData,
		parentRow: TData,
		index: number
	) => React.ReactNode;
	onAddFilter?: (field: string, value: string, tableTitle?: string) => void;
	onRowAction?: (row: TData) => void;
	onRowClick?: (field: string, value: string | number) => void;
}

export function FullScreenModal<TData extends { name: string | number }>({
	table,
	title,
	description,
	onClose,
	showSearch = true,
	globalFilter,
	onGlobalFilterChange,
	tabs,
	activeTab,
	onTabChange,
	expandable = false,
	getSubRows,
	renderSubRow,
	onAddFilter,
	onRowAction,
	onRowClick,
}: FullScreenModalProps<TData>) {
	return (
		<div className="relative flex h-full w-full flex-col bg-sidebar">
			<div className="flex items-start justify-between border-sidebar-border border-b bg-sidebar px-3 pt-3 pb-2">
				<div className="min-w-0 flex-1">
					{title && (
						<h3 className="truncate font-semibold text-sidebar-foreground text-sm">
							{title}
						</h3>
					)}
					{description && (
						<p className="mt-0.5 line-clamp-2 text-sidebar-foreground/70 text-xs">
							{description}
						</p>
					)}
				</div>
				<button
					aria-label="Close full screen"
					className="ml-2 flex items-center justify-center rounded bg-sidebar-accent/60 p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
					onClick={onClose}
					style={{ minWidth: 40, minHeight: 40 }}
					tabIndex={0}
					title="Close"
					type="button"
				>
					<XIcon size={20} />
				</button>
			</div>

			{tabs && tabs.length > 1 && (
				<div className="mt-2">
					<TableTabs
						activeTab={activeTab || ''}
						onTabChange={onTabChange || (() => {})}
						tabs={tabs}
					/>
				</div>
			)}

			{showSearch && (
				<div className="flex items-center px-3 py-2">
					<div className="relative w-full max-w-xs">
						<Input
							aria-label="Search table"
							className="h-8 w-full border-sidebar-border bg-sidebar-accent/30 pr-2 pl-7 text-sidebar-foreground text-xs"
							onChange={(event) => onGlobalFilterChange(event.target.value)}
							placeholder="Filter data..."
							value={globalFilter ?? ''}
						/>
						<MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-2 h-3 w-3 transform text-sidebar-foreground/50" />
						{globalFilter && (
							<button
								aria-label="Clear search"
								className="-translate-y-1/2 absolute top-1/2 right-2 rounded p-1 hover:bg-sidebar-accent/60"
								onClick={() => onGlobalFilterChange('')}
								type="button"
							>
								<XIcon className="h-3 w-3 text-sidebar-foreground/60" />
							</button>
						)}
					</div>
				</div>
			)}

			<div className="flex-1 overflow-auto px-3 pb-3">
				<TableContent
					activeTab={activeTab}
					expandable={expandable}
					getSubRows={getSubRows}
					globalFilter={globalFilter}
					minHeight="100%"
					onAddFilter={onAddFilter}
					onGlobalFilterChange={onGlobalFilterChange}
					onRowAction={onRowAction}
					onRowClick={onRowClick}
					renderSubRow={renderSubRow}
					table={table}
					tabs={tabs}
					title={title}
				/>
			</div>
		</div>
	);
}
