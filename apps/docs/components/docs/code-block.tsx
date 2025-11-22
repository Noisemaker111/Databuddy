import type * as React from "react";
import { cache } from "react";
import { createHighlighter } from "shiki";
import { SciFiCard } from "@/components/scifi-card";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

interface CodeBlockProps extends React.ComponentProps<"div"> {
	language?: string;
	filename?: string;
	code?: string;
	children?: React.ReactNode;
}

const getShikiHighlighter = cache(
	async () =>
		await createHighlighter({
			themes: ["vesper", "github-light"],
			langs: [
				"typescript",
				"javascript",
				"tsx",
				"jsx",
				"bash",
				"shell",
				"sh",
				"html",
				"css",
				"json",
				"python",
				"go",
				"rust",
				"sql",
				"yaml",
				"xml",
				"markdown",
				"plaintext",
			],
		})
);

async function CodeBlock({
	children,
	className,
	language = "text",
	filename,
	code,
}: CodeBlockProps) {
	const content = (code || children) as string;

	if (!content || typeof content !== "string") {
		return null;
	}

	const highlighter = await getShikiHighlighter();
	let highlightedCode: string | null = null;

	// Only attempt syntax highlighting for supported languages
	if (language !== "text" && language !== "plaintext") {
		try {
			highlightedCode = highlighter.codeToHtml(content, {
				lang: language,
				themes: {
					light: "github-light",
					dark: "vesper",
				},
				defaultColor: false,
				transformers: [
					{
						pre(node) {
							// Remove default styling to use our own
							node.properties.style = "";
							node.properties.tabindex = "-1";
						},
						code(node) {
							node.properties.style = "";
						},
					},
				],
			});
		} catch {
			// Fallback to plain text if language is not supported
			console.warn(
				`Shiki: Language "${language}" not supported, falling back to plain text`
			);
			highlightedCode = null;
		}
	}

	return (
		<SciFiCard
			className="group/code relative my-4 w-full overflow-hidden rounded border border-border bg-[#101010] text-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/20"
			cornerOpacity="opacity-0 group-hover/code:opacity-100"
			variant="primary"
		>
			{/* Header */}
			{(language !== "text" || filename) && (
				<div className="flex items-center justify-between border-white/5 border-b bg-white/5 px-4 py-2.5">
					<div className="flex items-center gap-3">
						{filename && (
							<span className="font-medium text-foreground/80 text-xs tracking-tight">
								{filename}
							</span>
						)}
						{language !== "text" && (
							<span className="rounded bg-primary/10 px-2 py-0.5 font-medium font-mono text-[10px] text-primary uppercase tracking-wider">
								{language}
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<CopyButton className="h-6 w-6" value={content} />
					</div>
				</div>
			)}

			{!filename && language === "text" && (
				<div className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-hover/code:opacity-100">
					<CopyButton
						className="h-7 w-7 bg-background/50 backdrop-blur-md"
						value={content}
					/>
				</div>
			)}

			{/* Code content */}
			<div className="relative">
				{highlightedCode ? (
					<div
						className={cn(
							"overflow-x-auto font-geist-mono text-[13px] leading-relaxed",
							"[&>pre]:m-0 [&>pre]:overflow-visible [&>pre]:p-4 [&>pre]:font-geist-mono [&>pre]:leading-relaxed",
							"[&>pre>code]:block [&>pre>code]:w-full [&>pre>code]:font-geist-mono [&>pre>code]:leading-relaxed",
							"[&_.line]:min-h-[1.25rem] [&_.line]:px-0",
							className
						)}
						dangerouslySetInnerHTML={{ __html: highlightedCode }}
					/>
				) : (
					<pre
						className={cn(
							"overflow-x-auto p-4 font-geist-mono text-foreground text-sm leading-relaxed",
							"[&>code]:block [&>code]:w-full [&>code]:p-0 [&>code]:text-inherit",
							className
						)}
						tabIndex={-1}
					>
						<code className="font-geist-mono">{content}</code>
					</pre>
				)}
			</div>
		</SciFiCard>
	);
}

interface InlineCodeProps extends React.ComponentProps<"code"> {}

function InlineCode({ className, ...props }: InlineCodeProps) {
	return (
		<code
			className={cn(
				"relative rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-geist-mono font-medium text-primary text-sm",
				className
			)}
			{...props}
		/>
	);
}

export { CodeBlock, InlineCode };
