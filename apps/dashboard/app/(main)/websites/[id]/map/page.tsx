'use client';

import type { LocationData } from '@databuddy/shared';
import { GlobeIcon } from '@phosphor-icons/react';
import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDateFilters } from '@/hooks/use-date-filters';
import { useMapLocationData } from '@/hooks/use-dynamic-query';
import { dynamicQueryFiltersAtom } from '@/stores/jotai/filterAtoms';

const MapComponent = dynamic(
	() =>
		import('@/components/analytics/map-component').then((mod) => ({
			default: mod.MapComponent,
		})),
	{
		loading: () => (
			<div className="flex h-full items-center justify-center rounded bg-muted/20">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<span className="font-medium text-muted-foreground text-sm">
						Loading map...
					</span>
				</div>
			</div>
		),
		ssr: false,
	}
);

function WebsiteMapPage() {
	const { id } = useParams<{ id: string }>();
	const [mode] = useState<'total' | 'perCapita'>('total');
	const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

	const { dateRange } = useDateFilters();
	const [filters] = useAtom(dynamicQueryFiltersAtom);

	const handleCountrySelect = useCallback((countryCode: string) => {
		setSelectedCountry(countryCode);
	}, []);

	const { isLoading, getDataForQuery } = useMapLocationData(
		id,
		dateRange,
		filters
	);

	const countriesFromQuery = getDataForQuery('map-countries', 'country');
	const regionsFromQuery = getDataForQuery('map-regions', 'region');

	const locationData = useMemo<LocationData>(() => {
		const countries = (countriesFromQuery || []).map(
			(item: {
				name: string;
				visitors: number;
				pageviews: number;
				country_code?: string;
				country_name?: string;
			}) => ({
				country: item.country_name || item.name,
				country_code: item.country_code || item.name,
				visitors: item.visitors,
				pageviews: item.pageviews,
			})
		);
		const regions = (regionsFromQuery || []).map(
			(item: { name: string; visitors: number; pageviews: number }) => ({
				country: item.name,
				visitors: item.visitors,
				pageviews: item.pageviews,
			})
		);
		return { countries, regions };
	}, [countriesFromQuery, regionsFromQuery]);

	const topCountries = useMemo(
		() =>
			locationData.countries
				.filter((c) => c.country && c.country.trim() !== '')
				.slice(0, 5),
		[locationData.countries]
	);

	const totalVisitors = useMemo(
		() =>
			locationData.countries.reduce(
				(sum, country) => sum + country.visitors,
				0
			),
		[locationData.countries]
	);

	if (!id) {
		return <div>No website ID</div>;
	}

	return (
		<div 
			className="h-screen overflow-hidden" 
			style={{ 
				width: 'calc(100% + 3rem)',
				marginTop: '-1.5rem',
				marginLeft: '-1.5rem',
				marginRight: '-1.5rem',
				marginBottom: '-1.5rem'
			}}
		>
			<div className="relative h-full w-full">
				{/* Full-screen Map */}
				<MapComponent
					height="100%"
					isLoading={isLoading}
					locationData={locationData}
					mode={mode}
					onCountrySelect={handleCountrySelect}
					selectedCountry={selectedCountry}
				/>

				{/* Top 5 Countries Overlay */}
				<div className="absolute top-2 right-2 z-20">
					<Card className="border-sidebar-border bg-background/90 backdrop-blur-md shadow-xl w-60">
						<CardHeader className="pb-2 pt-3 px-3">
							<CardTitle className="flex items-center gap-1.5 text-xs font-medium">
								<GlobeIcon className="h-3 w-3 text-primary" weight="duotone" />
								Top 5 Countries
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0 pb-1">
							{isLoading ? (
								<div className="space-y-1 px-3 pb-2">
									{new Array(5).fill(0).map((_, i) => (
										<div
											className="flex items-center justify-between py-1"
											key={`country-skeleton-${i + 1}`}
										>
											<div className="flex items-center gap-1.5">
												<Skeleton className="h-2.5 w-4 rounded" />
												<Skeleton className="h-2.5 w-12" />
											</div>
											<Skeleton className="h-2.5 w-6" />
										</div>
									))}
								</div>
							) : topCountries.length > 0 ? (
								<div className="px-3 pb-2">
									{topCountries.map((country) => {
										const percentage =
											totalVisitors > 0
												? (country.visitors / totalVisitors) * 100
												: 0;
										return (
											<button
												className="flex w-full cursor-pointer items-center justify-between py-1.5 text-left transition-colors hover:bg-primary/5 rounded-sm"
												key={country.country}
												onClick={() =>
													handleCountrySelect(
														country.country_code?.toUpperCase() ||
															country.country.toUpperCase()
													)
												}
												type="button"
											>
												<div className="flex items-center gap-1.5 min-w-0 flex-1">
													<div className="relative h-2.5 w-4 flex-shrink-0 overflow-hidden rounded shadow-sm">
														<Image
															alt={`${country.country} flag`}
															className="object-cover"
															fill
															sizes="16px"
															src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.country_code?.toUpperCase() || country.country.toUpperCase()}.svg`}
														/>
													</div>
													<div className="min-w-0 flex-1">
														<div className="truncate font-medium text-xs">
															{country.country}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-1.5 text-right">
													<div className="text-muted-foreground text-xs">
														{percentage.toFixed(0)}%
													</div>
													<div className="font-semibold text-xs min-w-0 text-primary">
														{country.visitors > 999 ? `${(country.visitors / 1000).toFixed(0)}k` : country.visitors.toString()}
													</div>
												</div>
											</button>
										);
									})}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center px-3">
									<div className="flex h-6 w-6 items-center justify-center rounded bg-muted/20 mb-1">
										<GlobeIcon
											className="h-3 w-3 text-muted-foreground/50"
											weight="duotone"
										/>
									</div>
									<p className="text-muted-foreground text-xs">
										No data
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default function Page() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[calc(100vh-7rem)] items-center justify-center">
					<div className="flex flex-col items-center gap-3">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						<span className="font-medium text-muted-foreground text-sm">
							Loading...
						</span>
					</div>
				</div>
			}
		>
			<WebsiteMapPage />
		</Suspense>
	);
}
