"use client";

import PricingTable from "@/components/autumn/pricing-table";

type PlansTabProps = {
	selectedPlan?: string | null;
}

export function PlansTab({ selectedPlan }: PlansTabProps) {
	return <PricingTable selectedPlan={selectedPlan} />;
}
