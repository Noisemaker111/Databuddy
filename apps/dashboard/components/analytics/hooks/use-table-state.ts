import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

interface UseTableStateProps<TData> {
	data: TData[];
	columns: ColumnDef<TData, unknown>[];
	showSearch?: boolean;
	activeTab?: string;
}

export function useTableState<TData extends { name: string | number }>({
	data,
	columns,
	showSearch = true,
	activeTab,
}: UseTableStateProps<TData>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');

	const table = useReactTable({
		data,
		columns,
		getRowId: (row, index) => {
			if ((row as any)._uniqueKey) {
				return (row as any)._uniqueKey;
			}
			return activeTab ? `${activeTab}-${index}` : `row-${index}`;
		},
		state: {
			sorting,
			globalFilter: showSearch ? globalFilter : '',
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const displayData = table.getRowModel().rows;
	const hasData = displayData.length > 0;

	return {
		table,
		sorting,
		setSorting,
		globalFilter,
		setGlobalFilter,
		displayData,
		hasData,
	};
}
