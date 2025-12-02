"use client";

import {
	CameraIcon,
	GithubLogoIcon,
	GoogleLogoIcon,
	KeyIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { RightSidebar } from "@/components/right-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsRow, SettingsSection } from "../_components/settings-section";

type ConnectedIdentity = {
	provider: "google" | "github";
	email: string;
	connected: boolean;
};

const connectedIdentities: ConnectedIdentity[] = [
	{ provider: "google", email: "user@gmail.com", connected: true },
	{ provider: "github", email: "user@github.com", connected: false },
];

const providerIcons = {
	google: GoogleLogoIcon,
	github: GithubLogoIcon,
};

const providerNames = {
	google: "Google",
	github: "GitHub",
};

export default function AccountSettingsPage() {
	const [name, setName] = useState("John Doe");
	const [email, setEmail] = useState("john@example.com");
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

	return (
		<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
			<div className="flex flex-col">
				<div className="flex-1 overflow-y-auto">
					{/* Profile Photo */}
					<SettingsSection
						description="Upload a photo to personalize your account"
						title="Profile Photo"
					>
						<div className="flex items-center gap-4">
							<Avatar className="size-20">
								<AvatarImage alt={name} src="" />
								<AvatarFallback className="bg-primary/10 font-semibold text-primary text-xl">
									{name
										.split(" ")
										.map((n) => n[0])
										.join("")
										.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="space-y-2">
								<Button size="sm" variant="outline">
									<CameraIcon className="mr-2 size-4" />
									Upload Photo
								</Button>
								<p className="text-muted-foreground text-xs">
									JPG, PNG or GIF. Max 2MB.
								</p>
							</div>
						</div>
					</SettingsSection>

					{/* Basic Info */}
					<SettingsSection
						description="Update your personal information"
						title="Basic Information"
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									onChange={(e) => setName(e.target.value)}
									placeholder="Your name…"
									value={name}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com…"
									type="email"
									value={email}
								/>
							</div>
						</div>
					</SettingsSection>

					{/* Security */}
					<SettingsSection
						description="Secure your account with additional authentication"
						title="Security"
					>
						<div className="space-y-4">
							<SettingsRow
								description="Add an extra layer of security to your account"
								label="Two-Factor Authentication"
							>
								<Switch
									checked={twoFactorEnabled}
									onCheckedChange={setTwoFactorEnabled}
								/>
							</SettingsRow>

							<SettingsRow
								description="Update your password regularly for security"
								label="Change Password"
							>
								<Button size="sm" variant="outline">
									<KeyIcon className="mr-2 size-4" />
									Change
								</Button>
							</SettingsRow>
						</div>
					</SettingsSection>

					{/* Connected Identities */}
					<SettingsSection
						description="Link your accounts for easier sign-in"
						title="Connected Identities"
					>
						<div className="space-y-3">
							{connectedIdentities.map((identity) => {
								const Icon = providerIcons[identity.provider];
								return (
									<div
										className="flex items-center justify-between rounded border bg-accent/30 p-3"
										key={identity.provider}
									>
										<div className="flex items-center gap-3">
											<div className="flex size-10 items-center justify-center rounded bg-background">
												<Icon className="size-5" weight="duotone" />
											</div>
											<div>
												<p className="font-medium text-sm">
													{providerNames[identity.provider]}
												</p>
												{identity.connected && (
													<p className="text-muted-foreground text-xs">
														{identity.email}
													</p>
												)}
											</div>
										</div>
										{identity.connected ? (
											<Badge variant="green">Connected</Badge>
										) : (
											<Button size="sm" variant="outline">
												Connect
											</Button>
										)}
									</div>
								);
							})}
						</div>
					</SettingsSection>
				</div>
			</div>

			<RightSidebar className="gap-0 p-0">
				<RightSidebar.Section border title="Account Status">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Email verified
							</span>
							<Badge variant="green">Yes</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">2FA enabled</span>
							<Badge variant={twoFactorEnabled ? "green" : "gray"}>
								{twoFactorEnabled ? "Yes" : "No"}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Member since
							</span>
							<span className="font-medium text-sm">Jan 2024</span>
						</div>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section border title="Connected Apps">
					<div className="space-y-2">
						{connectedIdentities.map((identity) => {
							const Icon = providerIcons[identity.provider];
							return (
								<div
									className="flex items-center gap-2"
									key={identity.provider}
								>
									<Icon className="size-4 text-muted-foreground" />
									<span className="flex-1 text-sm">
										{providerNames[identity.provider]}
									</span>
									<span
										className={`size-2 rounded-full ${identity.connected ? "bg-green-500" : "bg-muted"}`}
									/>
								</div>
							);
						})}
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section>
					<RightSidebar.Tip description="Keep your email up to date to ensure you receive important notifications about your account." />
				</RightSidebar.Section>
			</RightSidebar>
		</div>
	);
}
