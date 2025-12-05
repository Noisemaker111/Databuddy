"use client";

import { ArrowLeftIcon, HouseIcon, LockIcon, MagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WebsiteErrorStateProps = {
	error: unknown;
	websiteId?: string;
	isDemoRoute?: boolean;
};

function getErrorType(error: unknown): {
	type: "not_found" | "unauthorized" | "forbidden" | "unknown";
	message?: string;
	code?: string;
} {
	if (!error || typeof error !== "object") {
		return { type: "unknown" };
	}

	const rpcError = error as {
		data?: { code?: string; message?: string };
		code?: string;
		message?: string;
	};

	const errorCode = rpcError?.data?.code ?? rpcError?.code;
	const errorMessage = rpcError?.data?.message ?? rpcError?.message ?? "";

	if (errorCode) {
		switch (errorCode) {
			case "NOT_FOUND":
				return { type: "not_found", message: errorMessage, code: "NOT_FOUND" };
			case "UNAUTHORIZED":
				return { type: "unauthorized", message: errorMessage, code: "UNAUTHORIZED" };
			case "FORBIDDEN":
				return { type: "forbidden", message: errorMessage, code: "FORBIDDEN" };
			default:
				return { type: "unknown", message: errorMessage, code: errorCode };
		}
	}

	const messageLower = errorMessage.toLowerCase();
	if (
		messageLower.includes("authentication is required") ||
		messageLower.includes("unauthorized") ||
		messageLower.includes("sign in") ||
		messageLower.includes("login")
	) {
		return { type: "unauthorized", message: errorMessage, code: "UNAUTHORIZED" };
	}

	if (
		messageLower.includes("not found") ||
		messageLower.includes("doesn't exist")
	) {
		return { type: "not_found", message: errorMessage, code: "NOT_FOUND" };
	}

	if (
		messageLower.includes("permission") ||
		messageLower.includes("forbidden") ||
		messageLower.includes("access denied")
	) {
		return { type: "forbidden", message: errorMessage, code: "FORBIDDEN" };
	}

	return { type: "unknown", message: errorMessage };
}

export function WebsiteErrorState({
	error,
	websiteId,
	isDemoRoute = false,
}: WebsiteErrorStateProps) {
	const router = useRouter();
	const { type, message, code } = getErrorType(error);

	const getErrorCode = () => {
		switch (type) {
			case "not_found":
				return "ERR_WEBSITE_NOT_FOUND";
			case "unauthorized":
				return "ERR_UNAUTHORIZED";
			case "forbidden":
				return "ERR_FORBIDDEN";
			default:
				return "ERR_UNKNOWN";
		}
	};

	const getErrorNumber = () => {
		switch (type) {
			case "not_found":
				return "404";
			case "unauthorized":
				return "401";
			case "forbidden":
				return "403";
			default:
				return "500";
		}
	};

	const getIcon = () => {
		switch (type) {
			case "not_found":
				return MagnifyingGlassIcon;
			case "unauthorized":
			case "forbidden":
				return LockIcon;
			default:
				return WarningCircleIcon;
		}
	};

	const getTitle = () => {
		switch (type) {
			case "not_found":
				return "Website Not Found";
			case "unauthorized":
				return isDemoRoute ? "Demo Not Available" : "Authentication Required";
			case "forbidden":
				return isDemoRoute ? "Demo Not Available" : "Access Denied";
			default:
				return "Something Went Wrong";
		}
	};

	const getDescription = () => {
		switch (type) {
			case "not_found":
				return isDemoRoute
					? "This demo page doesn't exist or is no longer available."
					: "The website you're looking for doesn't exist or has been removed.";
			case "unauthorized":
				return isDemoRoute
					? "This demo page is private and requires authentication."
					: "You need to sign in to view this website's analytics.";
			case "forbidden":
				return isDemoRoute
					? "This demo page is private and requires authentication."
					: "You don't have permission to view this website's analytics.";
			default:
				return message || "We encountered an error while loading this website.";
		}
	};

	const renderActions = () => {
		if (type === "not_found") {
			return (
				<Button
					asChild
					className="bg-primary hover:bg-primary/90"
					variant="default"
				>
					<Link href={isDemoRoute ? "/" : "/websites"}>
						<HouseIcon className="mr-2 size-4" weight="duotone" />
						Back to Websites
					</Link>
				</Button>
			);
		}

		if (type === "unauthorized" || type === "forbidden") {
			return (
				<div className="flex w-full max-w-xs flex-col gap-4 sm:flex-row">
					{isDemoRoute ? (
						<>
							<Button
								onClick={() => router.push("/auth/sign-in")}
								variant="default"
								size="lg"
								className="flex-1 bg-primary hover:bg-primary/90"
							>
								Sign In
							</Button>
							<Button
								onClick={() => router.push("/")}
								variant="outline"
								size="lg"
								className="flex-1"
							>
								Go to Homepage
							</Button>
						</>
					) : (
						<>
							<Button
								onClick={() => router.push("/websites")}
								variant="default"
								size="lg"
								className="flex-1 bg-primary hover:bg-primary/90"
							>
								<ArrowLeftIcon className="mr-2 size-4" weight="duotone" />
								Back to Websites
							</Button>
							{type === "unauthorized" && (
								<Button
									onClick={() => router.push("/auth/sign-in")}
									variant="outline"
									size="lg"
									className="flex-1"
								>
									Sign In
								</Button>
							)}
						</>
					)}
				</div>
			);
		}

		return (
			<div className="flex w-full max-w-xs flex-col gap-4 sm:flex-row">
				<Button
					onClick={() => router.refresh()}
					variant="default"
					size="lg"
					className="flex-1 bg-primary hover:bg-primary/90"
				>
					Try Again
				</Button>
				<Button
					onClick={() => router.push(isDemoRoute ? "/" : "/websites")}
					variant="outline"
					size="lg"
					className="flex-1"
				>
					{isDemoRoute ? "Go to Homepage" : "Back to Websites"}
				</Button>
			</div>
		);
	};

	const IconComponent = getIcon();
	const actions = renderActions();

	return (
		<div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
			<Card className="flex w-full max-w-md flex-1 flex-col items-center justify-center rounded border-none bg-transparent shadow-none">
				<CardContent className="flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-12 py-12 sm:py-14">
					<div
						aria-hidden="true"
						className={cn(
							"flex size-12 items-center justify-center rounded-2xl",
							type === "not_found" && "bg-accent",
							(type === "unauthorized" || type === "forbidden") && "bg-orange-500/10",
							type === "unknown" && "bg-destructive/10"
						)}
						role="img"
					>
						<IconComponent
							aria-hidden="true"
							className={cn(
								"size-6",
								type === "not_found" && "text-muted-foreground",
								(type === "unauthorized" || type === "forbidden") && "text-orange-500 dark:text-orange-400",
								type === "unknown" && "text-destructive"
							)}
							size={24}
							weight="fill"
						/>
					</div>

					<div className="mt-6 space-y-4 max-w-sm">
						<h1 className="font-semibold text-foreground text-lg">
							{getTitle()}
						</h1>
						<p className="text-muted-foreground text-sm leading-relaxed text-balance">
							{getDescription()}
						</p>
					</div>

					{actions && (
						<div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
							{actions}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

