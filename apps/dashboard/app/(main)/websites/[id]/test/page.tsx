'use client';

import { DownloadIcon } from '@phosphor-icons/react';
import { useParams } from 'next/navigation';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { CustomEventsWithProperties } from './components/custom-events-with-properties';
import { DataExport } from './components/data-export';

export default function TestPage() {
	const params = useParams();
	const websiteId = params.id as string;

	return (
		<div className="p-3 sm:p-4 lg:p-6">
			<div className="mb-6">
				<h1 className="mb-2 font-bold text-2xl text-foreground">
					Test Features
				</h1>
				<p className="text-muted-foreground">
					Testing various features including custom events and data export
				</p>
			</div>

			<div className="space-y-8">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DownloadIcon className="h-5 w-5" weight="duotone" />
							Data Export
						</CardTitle>
						<CardDescription>
							Export your website's analytics data including events, errors, and
							web vitals. Data is exported as a ZIP file with separate files for
							each data type.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<DataExport websiteId={websiteId} />
					</CardContent>
				</Card>

				<CustomEventsWithProperties websiteId={websiteId} />
			</div>
		</div>
	);
}
