import { cn } from '@/lib/utils';

interface TabConfig<TData> {
	id: string;
	label: string;
	data: TData[];
	columns: any[];
	getFilter?: (row: TData) => { field: string; value: string };
}

interface TabButtonProps<TData> {
	tab: TabConfig<TData>;
	isActive: boolean;
	itemCount: number;
	onTabChange: (tabId: string) => void;
}

const TabButton = <TData,>({
	tab,
	isActive,
	itemCount,
	onTabChange,
}: TabButtonProps<TData>) => (
	<button
		aria-controls={`tabpanel-${tab.id}`}
		aria-selected={isActive}
		className={cn(
			'cursor-pointer border-b-2 px-3 py-2 text-sm transition-all duration-100 hover:text-foreground',
			isActive
				? 'border-foreground text-foreground'
				: 'border-transparent text-muted-foreground'
		)}
		onClick={() => onTabChange(tab.id)}
		role="tab"
		type="button"
	>
		{tab.label}
		{itemCount > 0 && (
			<span className="ml-1 text-xs opacity-60">
				({itemCount > 999 ? '999+' : itemCount})
			</span>
		)}
	</button>
);

interface TableTabsProps<TData> {
	tabs: TabConfig<TData>[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
}

export function TableTabs<TData>({
	tabs,
	activeTab,
	onTabChange,
}: TableTabsProps<TData>) {
	if (!tabs || tabs.length <= 1) {
		return null;
	}

	return (
		<div className="mt-3 px-3">
			<div className="flex gap-1 border-b" role="tablist">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;
					const itemCount = tab?.data?.length || 0;

					return (
						<TabButton
							isActive={isActive}
							itemCount={itemCount}
							key={tab.id}
							onTabChange={onTabChange}
							tab={tab}
						/>
					);
				})}
			</div>
		</div>
	);
}
