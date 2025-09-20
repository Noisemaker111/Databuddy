import { useCallback, useState } from 'react';

const TAB_TRANSITION_DELAY = 150;

interface TabConfig<TData> {
	id: string;
	label: string;
	data: TData[];
	columns: any[];
	getFilter?: (row: TData) => { field: string; value: string };
}

interface UseDataTableTabsProps<TData> {
	tabs?: TabConfig<TData>[];
	onGlobalFilterChange?: (filter: string) => void;
	onExpandedRowChange?: (rowId: string | null) => void;
}

export function useDataTableTabs<TData>({
	tabs,
	onGlobalFilterChange,
	onExpandedRowChange,
}: UseDataTableTabsProps<TData>) {
	const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || '');
	const [isTransitioning, setIsTransitioning] = useState(false);

	const handleTabChange = useCallback(
		(tabId: string) => {
			if (tabId === activeTab) {
				return;
			}

			setIsTransitioning(true);
			setTimeout(() => {
				setActiveTab(tabId);
				onGlobalFilterChange?.('');
				onExpandedRowChange?.(null);
				setIsTransitioning(false);
			}, TAB_TRANSITION_DELAY);
		},
		[activeTab, onGlobalFilterChange, onExpandedRowChange]
	);

	const currentTabData = tabs?.find((tab) => tab.id === activeTab);

	return {
		activeTab,
		setActiveTab,
		isTransitioning,
		handleTabChange,
		currentTabData,
	};
}
