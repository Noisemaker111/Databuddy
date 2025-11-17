"use client";

import {
	ActivityIcon,
	CreditCardIcon,
	CurrencyDollarIcon,
	ReceiptIcon,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect, useState } from "react";
import { PageHeader } from "@/app/(main)/websites/_components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type Customer,
	type Invoice,
	useBillingData,
} from "./hooks/use-billing";

const OverviewTab = lazy(() =>
	import("./components/overview-tab").then((m) => ({ default: m.OverviewTab }))
);
const PlansTab = lazy(() =>
	import("./components/plans-tab").then((m) => ({ default: m.PlansTab }))
);
const HistoryTab = lazy(() =>
	import("./components/history-tab").then((m) => ({ default: m.HistoryTab }))
);

function ComponentSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-32 w-full rounded" />
			<Skeleton className="h-64 w-full rounded" />
			<Skeleton className="h-48 w-full rounded" />
		</div>
	);
}

export default function BillingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("tab") || "overview";
	const selectedPlan = searchParams.get("plan");

	const navigateToPlans = () => {
		router.push("/billing?tab=plans");
	};

	const { customerData, isLoading } = useBillingData();
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [hasLoadedInvoices, setHasLoadedInvoices] = useState(false);

	useEffect(() => {
		if (!isLoading && customerData?.invoices && !hasLoadedInvoices) {
			setInvoices(customerData.invoices as Invoice[]);
			setHasLoadedInvoices(true);
		}
	}, [customerData?.invoices, isLoading, hasLoadedInvoices]);

	const getPageTitle = () => {
		switch (activeTab) {
			case "overview":
				return {
					title: "Usage & Metrics",
					description: "Monitor your usage and billing metrics",
					icon: <ActivityIcon />,
				};
			case "plans":
				return {
					title: "Plans & Pricing",
					description: "Manage your subscription and billing plan",
					icon: <CurrencyDollarIcon />,
				};
			case "history":
				return {
					title: "Payment History",
					description: "View your billing history and invoices",
					icon: <ReceiptIcon />,
				};
			default:
				return {
					title: "Billing & Subscription",
					description:
						"Manage your subscription, usage, and billing preferences",
					icon: <CreditCardIcon />,
				};
		}
	};

	const { title, description, icon } = getPageTitle();

	return (
		<div className="flex h-full flex-col">
			<PageHeader description={description} icon={icon} title={title} />
			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				{activeTab === "overview" && (
					<Suspense fallback={<ComponentSkeleton />}>
						<OverviewTab onNavigateToPlans={navigateToPlans} />
					</Suspense>
				)}
				{activeTab === "plans" && (
					<Suspense fallback={<ComponentSkeleton />}>
						<PlansTab selectedPlan={selectedPlan} />
					</Suspense>
				)}
				{activeTab === "history" && (
					<Suspense fallback={<ComponentSkeleton />}>
						<HistoryTab
							customerData={customerData as unknown as Customer}
							invoices={invoices}
							isLoading={isLoading && !hasLoadedInvoices}
						/>
					</Suspense>
				)}
			</main>
		</div>
	);
}
