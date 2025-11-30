"use client";

import {
	CalendarIcon,
	CaretLeftIcon,
	EyeIcon,
	EyeSlashIcon,
	MagnifyingGlassPlusIcon,
	NoteIcon,
	PlusIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	ANNOTATION_COLORS,
	COMMON_ANNOTATION_TAGS,
	DEFAULT_ANNOTATION_VALUES,
} from "@/lib/annotation-constants";
import {
	sanitizeAnnotationText,
	validateAnnotationForm,
} from "@/lib/annotation-utils";
import { cn } from "@/lib/utils";

type RangeSelectionPopupProps = {
	isOpen: boolean;
	position: { x: number; y: number };
	dateRange: {
		startDate: Date;
		endDate: Date;
	};
	onCloseAction: () => void;
	onZoomAction: (dateRange: { startDate: Date; endDate: Date }) => void;
	onCreateAnnotationAction: (annotation: {
		annotationType: "range";
		xValue: string;
		xEndValue: string;
		text: string;
		tags: string[];
		color: string;
		isPublic: boolean;
	}) => Promise<void> | void;
};

export function RangeSelectionPopup({
	isOpen,
	dateRange,
	onCloseAction,
	onZoomAction,
	onCreateAnnotationAction,
}: RangeSelectionPopupProps) {
	const [showAnnotationForm, setShowAnnotationForm] = useState(false);
	const [annotationText, setAnnotationText] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [customTag, setCustomTag] = useState("");
	const [selectedColor, setSelectedColor] = useState<string>(
		DEFAULT_ANNOTATION_VALUES.color
	);
	const [isPublic, setIsPublic] = useState<boolean>(
		DEFAULT_ANNOTATION_VALUES.isPublic
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCloseAction();
			} else if (e.key === "Enter" && e.ctrlKey && showAnnotationForm) {
				e.preventDefault();
				handleCreateAnnotation();
			} else if (e.key === "z" && e.ctrlKey && !showAnnotationForm) {
				e.preventDefault();
				handleZoom();
			} else if (e.key === "a" && e.ctrlKey && !showAnnotationForm) {
				e.preventDefault();
				setShowAnnotationForm(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, showAnnotationForm]);

	const handleZoom = () => {
		onZoomAction(dateRange);
		onCloseAction();
	};

	const handleCreateAnnotation = async () => {
		if (!annotationText.trim() || isSubmitting) {
			return;
		}

		const formData = {
			text: sanitizeAnnotationText(annotationText),
			tags: selectedTags,
			color: selectedColor,
			isPublic,
		};

		const validation = validateAnnotationForm(formData);
		if (!validation.isValid) {
			setValidationErrors(validation.errors);
			return;
		}

		setValidationErrors([]);
		setIsSubmitting(true);
		try {
			await onCreateAnnotationAction({
				annotationType: "range",
				xValue: dateRange.startDate.toISOString(),
				xEndValue: dateRange.endDate.toISOString(),
				...formData,
			});
			onCloseAction();
		} catch (error) {
			console.error("Error creating annotation:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const addTag = (tag: string) => {
		if (tag && !selectedTags.includes(tag)) {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const removeTag = (tag: string) => {
		setSelectedTags(selectedTags.filter((t) => t !== tag));
	};

	const handleCustomTagSubmit = () => {
		if (customTag.trim()) {
			addTag(customTag.trim());
			setCustomTag("");
		}
	};

	if (!isOpen) {
		return null;
	}

	const formatDateRange = () => {
		const start = dateRange.startDate.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
		const end = dateRange.endDate.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
		return dateRange.startDate.getTime() !== dateRange.endDate.getTime()
			? `${start} – ${end}`
			: start;
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm">
			<button
				aria-label="Close dialog"
				className="absolute inset-0 cursor-default"
				onClick={onCloseAction}
				type="button"
			/>
			<div
				aria-describedby="range-selection-description"
				aria-labelledby="range-selection-title"
				className="relative z-10 mx-4 w-full max-w-sm overflow-hidden rounded border bg-popover shadow-2xl"
				role="dialog"
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b bg-accent px-4 py-3">
					<div className="flex items-center gap-3">
						{showAnnotationForm && (
							<button
								className="flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
								onClick={() => setShowAnnotationForm(false)}
								type="button"
							>
								<CaretLeftIcon className="size-4" weight="bold" />
							</button>
						)}
						<div className="flex items-center gap-2">
							<CalendarIcon className="size-4 text-primary" weight="duotone" />
							<div>
								<h2
									className="font-medium text-foreground text-sm"
									id="range-selection-title"
								>
									{showAnnotationForm ? "New Annotation" : "Selection"}
								</h2>
								<p
									className="text-muted-foreground text-xs"
									id="range-selection-description"
								>
									{formatDateRange()}
								</p>
							</div>
						</div>
					</div>
					<button
						className="flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
						onClick={onCloseAction}
						type="button"
					>
						<XIcon className="size-4" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4">
					{showAnnotationForm ? (
						<div className="space-y-4">
							{/* Annotation Text */}
							<div className="space-y-2">
								<Label
									className="text-muted-foreground text-xs"
									htmlFor="annotation-text"
								>
									Description
								</Label>
								<Textarea
									autoFocus
									className="resize-none text-sm"
									disabled={isSubmitting}
									id="annotation-text"
									maxLength={DEFAULT_ANNOTATION_VALUES.maxTextLength}
									onChange={(e) => setAnnotationText(e.target.value)}
									placeholder="What happened during this period?"
									rows={2}
									value={annotationText}
								/>
								<div className="flex items-center justify-between">
									{validationErrors.length > 0 ? (
										<span className="text-destructive text-xs">
											{validationErrors[0]}
										</span>
									) : (
										<span className="text-muted-foreground/60 text-xs">
											Keep it concise
										</span>
									)}
									<span
										className={cn(
											"text-xs tabular-nums",
											annotationText.length >
												DEFAULT_ANNOTATION_VALUES.maxTextLength * 0.9
												? "text-warning"
												: "text-muted-foreground/60"
										)}
									>
										{annotationText.length}/
										{DEFAULT_ANNOTATION_VALUES.maxTextLength}
									</span>
								</div>
							</div>

							{/* Tags */}
							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">Tags</Label>
								{selectedTags.length > 0 && (
									<div className="flex flex-wrap gap-1.5">
										{selectedTags.map((tag) => (
											<Badge
												className="cursor-pointer gap-1 px-2 py-0.5 text-xs transition-colors hover:bg-destructive hover:text-destructive-foreground"
												key={tag}
												onClick={() => removeTag(tag)}
												variant="secondary"
											>
												{tag}
												<XIcon className="size-2.5" />
											</Badge>
										))}
									</div>
								)}
								<div className="flex gap-2">
									<Input
										className="h-8 text-sm"
										disabled={isSubmitting}
										onChange={(e) => setCustomTag(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleCustomTagSubmit();
											}
										}}
										placeholder="Add tag…"
										value={customTag}
									/>
									<Button
										className="h-8 w-8 shrink-0"
										disabled={!customTag.trim() || isSubmitting}
										onClick={handleCustomTagSubmit}
										size="icon"
										variant="outline"
									>
										<PlusIcon className="size-3.5" />
									</Button>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{COMMON_ANNOTATION_TAGS.filter(
										(tag) => !selectedTags.includes(tag.value)
									)
										.slice(0, 5)
										.map((tag) => (
											<button
												className="flex cursor-pointer items-center gap-1.5 rounded border bg-background px-2 py-1 text-muted-foreground text-xs transition-all hover:border-primary hover:bg-accent hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
												disabled={isSubmitting}
												key={tag.value}
												onClick={() => addTag(tag.value)}
												type="button"
											>
												<div
													className="size-2 rounded-full"
													style={{ backgroundColor: tag.color }}
												/>
												{tag.label}
											</button>
										))}
								</div>
							</div>

							{/* Color */}
							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">Color</Label>
								<div className="flex gap-2">
									{ANNOTATION_COLORS.map((color) => (
										<button
											className={cn(
												"size-7 cursor-pointer rounded-full border-2 shadow-sm transition-all hover:scale-110 hover:shadow-md active:scale-100 disabled:cursor-not-allowed disabled:opacity-50",
												selectedColor === color.value
													? "scale-110 border-foreground ring-2 ring-ring"
													: "border-transparent hover:border-muted-foreground"
											)}
											disabled={isSubmitting}
											key={color.value}
											onClick={() => setSelectedColor(color.value)}
											style={{ backgroundColor: color.value }}
											title={color.label}
											type="button"
										/>
									))}
								</div>
							</div>

							{/* Visibility */}
							<div className="flex items-center justify-between rounded border bg-accent px-3 py-2.5">
								<div className="flex items-center gap-2">
									{isPublic ? (
										<EyeIcon className="size-4 text-primary" weight="duotone" />
									) : (
										<EyeSlashIcon
											className="size-4 text-muted-foreground"
											weight="duotone"
										/>
									)}
									<div>
										<span className="font-medium text-foreground text-sm">
											Public
										</span>
										<span className="ml-1.5 text-muted-foreground text-xs">
											Visible to team
										</span>
									</div>
								</div>
								<Switch
									checked={isPublic}
									disabled={isSubmitting}
									onCheckedChange={setIsPublic}
								/>
							</div>

							{/* Actions */}
							<div className="flex gap-2 pt-1">
								<Button
									className="flex-1"
									disabled={isSubmitting}
									onClick={onCloseAction}
									variant="outline"
								>
									Cancel
								</Button>
								<Button
									className="flex-1 gap-2"
									disabled={!annotationText.trim() || isSubmitting}
									onClick={handleCreateAnnotation}
								>
									{isSubmitting ? (
										<>
											<div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
											Creating…
										</>
									) : (
										<>
											<NoteIcon className="size-4" weight="duotone" />
											Create
										</>
									)}
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<button
								className="group flex w-full cursor-pointer items-center gap-3 rounded border bg-background p-3 text-left shadow-sm transition-all hover:border-primary hover:bg-accent hover:shadow-md active:scale-[0.98]"
								onClick={handleZoom}
								type="button"
							>
								<div className="flex size-10 shrink-0 items-center justify-center rounded bg-accent transition-all group-hover:bg-primary group-hover:shadow-lg">
									<MagnifyingGlassPlusIcon
										className="size-5 text-muted-foreground transition-colors group-hover:text-primary-foreground"
										weight="duotone"
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-foreground text-sm">
										Zoom to range
									</p>
									<p className="text-muted-foreground text-xs">
										Focus on this period
									</p>
								</div>
								<kbd className="rounded bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm transition-colors group-hover:bg-secondary-brighter group-hover:text-primary">
									⌘Z
								</kbd>
							</button>

							<button
								className="group flex w-full cursor-pointer items-center gap-3 rounded border bg-background p-3 text-left shadow-sm transition-all hover:border-primary hover:bg-accent hover:shadow-md active:scale-[0.98]"
								onClick={() => setShowAnnotationForm(true)}
								type="button"
							>
								<div className="flex size-10 shrink-0 items-center justify-center rounded bg-accent transition-all group-hover:bg-primary group-hover:shadow-lg">
									<NoteIcon
										className="size-5 text-muted-foreground transition-colors group-hover:text-primary-foreground"
										weight="duotone"
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-foreground text-sm">
										Add annotation
									</p>
									<p className="text-muted-foreground text-xs">
										Mark with a note
									</p>
								</div>
								<kbd className="rounded bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm transition-colors group-hover:bg-secondary-brighter group-hover:text-primary">
									⌘A
								</kbd>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
