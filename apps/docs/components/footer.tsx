import { FaDiscord, FaGithub, FaXTwitter } from 'react-icons/fa6';
import { IoMdMail } from 'react-icons/io';
import { Wordmark } from './landing/wordmark';
import { LogoContent } from './logo';

export function Footer() {
	return (
		<footer className="border-border border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4">
					<div className="col-span-2 space-y-4 md:col-span-1">
						<LogoContent />
						<p className="text-muted-foreground text-sm sm:text-base">
							Privacy-first web analytics without compromising user data.
						</p>
					</div>

					<div className="space-y-4">
						<h3 className="font-semibold text-base sm:text-lg">Product</h3>
						<ul className="space-y-2 text-sm sm:text-base">
							<li>
								<a
									className="text-muted-foreground hover:text-foreground"
									href="/docs"
								>
									Documentation
								</a>
							</li>
							<li>
								<a
									className="text-muted-foreground hover:text-foreground"
									href="/pricing"
								>
									Pricing
								</a>
							</li>
							<li>
								<a
									className="text-muted-foreground hover:text-foreground"
									href="https://app.databuddy.cc"
								>
									Dashboard
								</a>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h3 className="font-semibold text-base sm:text-lg">Company</h3>
						<ul className="space-y-2 text-sm sm:text-base">
							<li>
								<a
									className="text-muted-foreground hover:text-foreground"
									href="/blog"
								>
									Blog
								</a>
							</li>
							<li>
								<a
									className="text-muted-foreground hover:text-foreground"
									href="/privacy"
								>
									Privacy
								</a>
							</li>
							<li>
								<a
									className="text-muted-foreground hover:text-foreground"
									href="/terms"
								>
									Terms
								</a>
							</li>
						</ul>
					</div>

					<div className="col-span-2 space-y-4 md:col-span-1">
						<h3 className="font-semibold text-base sm:text-lg">Contact</h3>
						<ul className="space-y-3 text-sm sm:text-base">
							<li>
								<a
									className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
									href="mailto:support@databuddy.cc"
								>
									<IoMdMail className="h-5 w-5" />
									support@databuddy.cc
								</a>
							</li>
							<li>
								<a
									className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
									href="https://discord.gg/JTk7a38tCZ"
									rel="noopener"
									target="_blank"
								>
									<FaDiscord className="h-5 w-5" />
									Discord
								</a>
							</li>
							<li>
								<a
									className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
									href="https://github.com/databuddy-analytics"
									rel="noopener"
									target="_blank"
								>
									<FaGithub className="h-5 w-5" />
									GitHub
								</a>
							</li>
							<li>
								<a
									className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
									href="https://x.com/trydatabuddy"
									rel="noopener"
									target="_blank"
								>
									<FaXTwitter className="h-5 w-5" />X (Twitter)
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-8 flex flex-col items-center justify-between gap-4 border-border border-t pt-6 sm:flex-row">
					<p className="text-muted-foreground text-sm sm:text-base">
						© {new Date().getFullYear()} Databuddy
					</p>
					<div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
						<a
							className="transition-opacity hover:opacity-80"
							href="https://twelve.tools"
							rel="noopener"
							target="_blank"
						>
							<span className="sr-only">Featured on Twelve Tools</span>
							<svg
								aria-hidden
								className="h-8 w-auto sm:h-10"
								role="img"
								viewBox="0 0 300 80"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>Featured on Twelve Tools</title>
								<rect
									fill="currentColor"
									height="80"
									opacity="0.1"
									rx="8"
									width="300"
								/>
								<text
									dominantBaseline="middle"
									fill="currentColor"
									fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
									fontSize="16"
									textAnchor="middle"
									x="50%"
									y="50%"
								>
									Featured on Twelve Tools
								</text>
							</svg>
						</a>
						<p className="text-muted-foreground text-sm sm:text-base">
							Privacy-first analytics
						</p>
					</div>
				</div>
				<Wordmark />
			</div>
		</footer>
	);
}
