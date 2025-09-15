'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FlagIcon, PlusIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';

const userRuleSchema = z.object({
	type: z.enum(['user_id', 'email', 'property', 'percentage']),
	operator: z.enum([
		'equals',
		'contains',
		'starts_with',
		'ends_with',
		'in',
		'not_in',
		'exists',
		'not_exists',
	]),
	field: z.string().optional(), // For property rules
	value: z.any().optional(),
	values: z.array(z.any()).optional(), // For 'in' and 'not_in' operators
	enabled: z.boolean(),
	// Batch support
	batch: z.boolean().default(false),
	batchValues: z.array(z.string()).optional(),
});

const flagFormSchema = z.object({
	key: z
		.string()
		.min(1, 'Key is required')
		.max(100, 'Key too long')
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'Key must contain only letters, numbers, underscores, and hyphens'
		),
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name too long')
		.optional(),
	description: z.string().optional(),
	type: z.enum(['boolean', 'rollout']),
	status: z.enum(['active', 'inactive', 'archived']),
	defaultValue: z.boolean(),
	payload: z.string().optional(),
	rolloutPercentage: z.number().min(0).max(100),
	rules: z.array(userRuleSchema).optional(),
});

type FlagFormData = z.infer<typeof flagFormSchema>;

interface FlagSheetProps {
	isOpen: boolean;
	onClose: () => void;
	websiteId: string;
	flagId?: string | null;
}

export function FlagSheet({
	isOpen,
	onClose,
	websiteId,
	flagId,
}: FlagSheetProps) {
	const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
	const [showPayload, setShowPayload] = useState(false);
	const [sliderValue, setSliderValue] = useState(0);
	const isEditing = Boolean(flagId);

	const form = useForm<FlagFormData>({
		resolver: zodResolver(flagFormSchema),
		defaultValues: {
			key: '',
			name: '',
			description: '',
			type: 'boolean',
			status: 'active',
			defaultValue: false,
			payload: '',
			rolloutPercentage: 0,
			rules: [],
		},
	});

	// Fetch flag data for editing
	const { data: flagData } = trpc.flags.getById.useQuery(
		{ id: flagId ?? '', websiteId },
		{ enabled: isEditing && Boolean(flagId) }
	);

	// Mutations
	const createMutation = trpc.flags.create.useMutation();
	const updateMutation = trpc.flags.update.useMutation();

	// Reset form when sheet opens/closes or flag data changes
	useEffect(() => {
		if (isOpen) {
			if (flagData && isEditing) {
				const hasPayload = Boolean(flagData.payload);
				form.reset({
					key: flagData.key,
					name: flagData.name || '',
					description: flagData.description || '',
					type: flagData.type as 'boolean' | 'rollout',
					status: flagData.status as 'active' | 'inactive' | 'archived',
					defaultValue: Boolean(flagData.defaultValue),
					payload: flagData.payload
						? JSON.stringify(flagData.payload, null, 2)
						: '',
					rolloutPercentage: flagData.rolloutPercentage || 0,
					rules: (flagData.rules as any[]) || [],
				});
				setShowPayload(hasPayload);
				setSliderValue(flagData.rolloutPercentage || 0);
			} else {
				form.reset();
				setShowPayload(false);
				setSliderValue(0);
			}
			setKeyManuallyEdited(false);
		}
	}, [isOpen, flagData, isEditing, form]);

	// Auto-generate key from name
	const watchedName = form.watch('name');
	const watchedType = form.watch('type');

	useEffect(() => {
		if (isEditing || keyManuallyEdited || !watchedName) {
			return;
		}

		const key = watchedName
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 50);
		form.setValue('key', key);
	}, [watchedName, keyManuallyEdited, isEditing, form]);

	// Show rollout percentage only for rollout type
	const showRolloutPercentage = watchedType === 'rollout';

	const onSubmit = async (data: FlagFormData) => {
		try {
			let payload;
			if (data.payload?.trim()) {
				try {
					payload = JSON.parse(data.payload);
				} catch {
					toast.error('Invalid JSON payload');
					return;
				}
			}

			const mutation = isEditing ? updateMutation : createMutation;
			const mutationData =
				isEditing && flagId
					? {
							id: flagId,
							name: data.name || undefined,
							description: data.description || undefined,
							type: data.type,
							status: data.status,
							defaultValue: data.defaultValue,
							payload,
							rolloutPercentage: data.rolloutPercentage,
							rules: data.rules || [],
						}
					: {
							websiteId,
							key: data.key,
							name: data.name || undefined,
							description: data.description || undefined,
							type: data.type,
							status: data.status,
							defaultValue: data.defaultValue,
							payload,
							rolloutPercentage: data.rolloutPercentage,
							rules: data.rules || [],
						};

			await mutation.mutateAsync(mutationData as any);
			toast.success(`Flag ${isEditing ? 'updated' : 'created'} successfully`);
			onClose();
		} catch (error: any) {
			if (
				error?.message?.includes('unique') ||
				error?.message?.includes('CONFLICT')
			) {
				toast.error('A flag with this key already exists in this scope');
			} else if (error?.message?.includes('FORBIDDEN')) {
				toast.error('You do not have permission to perform this action');
			} else {
				toast.error(`Failed to ${isEditing ? 'update' : 'create'} flag`);
			}
		}
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<Sheet onOpenChange={onClose} open={isOpen}>
			<SheetContent
				className="w-full overflow-y-auto p-4 sm:w-[60vw] sm:max-w-[800px]"
				side="right"
			>
				<SheetHeader className="space-y-3 border-border/50 border-b pb-6">
					<div className="flex items-center gap-3">
						<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
							<FlagIcon
								className="h-6 w-6 text-primary"
								size={16}
								weight="duotone"
							/>
						</div>
						<div>
							<SheetTitle className="font-semibold text-foreground text-xl">
								{isEditing ? 'Edit Feature Flag' : 'Create Feature Flag'}
							</SheetTitle>
							<SheetDescription className="mt-1 text-muted-foreground">
								{isEditing
									? 'Update flag configuration and settings'
									: 'Set up a new feature flag for controlled rollouts'}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<div className="space-y-8 pt-6">
					<Form {...form}>
						<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
							{/* Basic Information */}
							<div className="space-y-6">
								<div className="space-y-1">
									<h3 className="font-semibold text-base text-foreground">
										Basic Information
									</h3>
									<p className="text-muted-foreground text-xs">
										Configure the flag name, key, and description
									</p>
								</div>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Flag Name
												</FormLabel>
												<FormControl>
													<Input
														className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
														placeholder="New Dashboard"
														{...field}
													/>
												</FormControl>
												<FormDescription className="text-muted-foreground text-xs">
													A human-readable name for this flag
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="key"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Key {!isEditing && '*'}
												</FormLabel>
												<FormControl>
													<Input
														className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
														placeholder="new-dashboard"
														{...field}
														disabled={isEditing}
														onChange={(e) => {
															const value = e.target.value;
															setKeyManuallyEdited(value.length > 0);
															field.onChange(value);
														}}
													/>
												</FormControl>
												<FormDescription className="text-muted-foreground text-xs">
													{isEditing
														? 'Cannot be changed after creation'
														: 'Unique identifier used in code'}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-medium text-foreground text-sm">
												Description
											</FormLabel>
											<FormControl>
												<Textarea
													className="rounded border-border/50 focus:border-primary/50 focus:ring-primary/20"
													placeholder="Enable the redesigned dashboard with improved UX"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-muted-foreground text-xs">
												Optional description of what this flag controls
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Flag Configuration */}
							<div className="space-y-6">
								<div className="space-y-1">
									<h3 className="font-semibold text-base text-foreground">
										Configuration
									</h3>
									<p className="text-muted-foreground text-xs">
										Set flag type, status, and default behavior
									</p>
								</div>

								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Flag Type *
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="rounded border-border/50">
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="rounded">
														<SelectItem value="boolean">
															<div className="flex flex-col">
																<span className="font-medium">Boolean</span>
																<span className="text-muted-foreground text-xs">
																	Simple on/off toggle
																</span>
															</div>
														</SelectItem>
														<SelectItem value="rollout">
															<div className="flex flex-col">
																<span className="font-medium">Rollout</span>
																<span className="text-muted-foreground text-xs">
																	Percentage-based gradual release
																</span>
															</div>
														</SelectItem>
													</SelectContent>
												</Select>
												<FormDescription className="text-muted-foreground text-xs">
													{watchedType === 'boolean' &&
														'Simple true/false flag for feature toggles'}
													{watchedType === 'rollout' &&
														'Gradual rollout with percentage control'}
													{!watchedType && 'Choose the type of feature flag'}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-medium text-foreground text-sm">
													Status
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="rounded border-border/50">
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="rounded">
														<SelectItem value="active">Active</SelectItem>
														<SelectItem value="inactive">Inactive</SelectItem>
														<SelectItem value="archived">Archived</SelectItem>
													</SelectContent>
												</Select>
												<FormDescription className="text-muted-foreground text-xs">
													Current flag status
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="defaultValue"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded border bg-muted/30 p-4">
											<div className="space-y-0.5">
												<FormLabel className="font-medium text-foreground text-sm">
													Default Value
												</FormLabel>
												<FormDescription className="text-muted-foreground text-xs">
													Value returned when no conditions match
												</FormDescription>
											</div>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>

							{/* Advanced Settings */}
							<div className="space-y-6">
								<div className="space-y-1">
									<h3 className="font-semibold text-base text-foreground">
										Advanced Settings
									</h3>
									<p className="text-muted-foreground text-xs">
										Configure rollout and payload options
									</p>
								</div>

								{/* Rollout Percentage - Only show for rollout type */}
								{showRolloutPercentage && (
									<div className="slide-in-from-top-2 animate-in duration-300">
										<FormField
											control={form.control}
											name="rolloutPercentage"
											render={({ field }) => {
												// Sync slider value with form value when form changes
												useEffect(() => {
													const formValue = Number(field.value) || 0;
													if (formValue !== sliderValue) {
														setSliderValue(formValue);
													}
												}, [field.value]);

												return (
													<FormItem>
														<FormLabel className="font-medium text-foreground text-sm">
															Rollout Percentage
														</FormLabel>
														<FormControl>
															<div className="space-y-3">
																<Slider
																	className="w-full"
																	max={100}
																	min={0}
																	onValueChange={(values) => {
																		const newValue = values[0];
																		setSliderValue(newValue);
																		field.onChange(newValue);
																	}}
																	step={1}
																	value={[sliderValue]}
																/>
																<div className="flex items-center justify-between text-muted-foreground text-xs">
																	<span>0%</span>
																	<span className="font-medium text-foreground">
																		{sliderValue}%
																	</span>
																	<span>100%</span>
																</div>
															</div>
														</FormControl>
														<FormDescription className="text-muted-foreground text-xs">
															{sliderValue}% of users will see this flag enabled
														</FormDescription>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
								)}

								{/* Payload Section - Expandable */}
								<div className="space-y-3">
									{showPayload ? (
										<div className="slide-in-from-top-2 animate-in duration-300">
											<FormField
												control={form.control}
												name="payload"
												render={({ field }) => (
													<FormItem>
														<div className="flex items-center justify-between">
															<FormLabel className="font-medium text-foreground text-sm">
																Payload (Optional)
															</FormLabel>
															<Button
																className="h-6 px-2 text-muted-foreground hover:text-foreground"
																onClick={() => {
																	setShowPayload(false);
																	form.setValue('payload', '');
																}}
																size="sm"
																type="button"
																variant="ghost"
															>
																Remove
															</Button>
														</div>
														<FormControl>
															<Textarea
																className="rounded border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
																placeholder='{"theme": "dark", "timeout": 5000}'
																rows={4}
																{...field}
															/>
														</FormControl>
														<FormDescription className="text-muted-foreground text-xs">
															JSON data returned when flag is enabled
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									) : (
										<Button
											className="group w-full rounded border-2 border-primary/30 border-dashed transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
											onClick={() => setShowPayload(true)}
											type="button"
											variant="outline"
										>
											<PlusIcon
												className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
												size={16}
											/>
											Add Payload (Optional)
										</Button>
									)}
								</div>

								{/* User Targeting Rules */}
								<div className="slide-in-from-top-2 animate-in space-y-4 duration-300">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="font-medium text-foreground text-sm">
												User Targeting
											</h3>
											<p className="text-muted-foreground text-xs">
												Define rules to target specific users
											</p>
										</div>
									</div>

									<FormField
										control={form.control}
										name="rules"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<UserRulesBuilder
														onChange={field.onChange}
														rules={field.value || []}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							<div className="flex justify-end gap-3 border-border/50 border-t pt-6">
								<Button
									className="rounded"
									onClick={onClose}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
								<Button
									className="relative rounded"
									disabled={isLoading}
									type="submit"
								>
									{isLoading && (
										<div className="absolute left-3">
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
										</div>
									)}
									<span className={isLoading ? 'ml-6' : ''}>
										{isLoading
											? 'Saving...'
											: isEditing
												? 'Update Flag'
												: 'Create Flag'}
									</span>
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}

// User Rules Builder Component
interface UserRule {
	type: 'user_id' | 'email' | 'property' | 'percentage';
	operator:
		| 'equals'
		| 'contains'
		| 'starts_with'
		| 'ends_with'
		| 'in'
		| 'not_in'
		| 'exists'
		| 'not_exists';
	field?: string;
	value?: any;
	values?: any[];
	enabled: boolean;
	// Batch support
	batch: boolean;
	batchValues?: string[];
}

interface UserRulesBuilderProps {
	rules: UserRule[];
	onChange: (rules: UserRule[]) => void;
}

function UserRulesBuilder({ rules, onChange }: UserRulesBuilderProps) {
	const [batchTextValues, setBatchTextValues] = useState<
		Record<number, string>
	>({});

	const addRule = () => {
		const newRule: UserRule = {
			type: 'user_id',
			operator: 'equals',
			value: '',
			enabled: true,
			batch: false,
		};
		onChange([...rules, newRule]);
	};

	const canUseBatch = (rule: UserRule) => {
		return (
			rule.type !== 'percentage' &&
			rule.operator !== 'exists' &&
			rule.operator !== 'not_exists'
		);
	};

	const updateRule = (index: number, updatedRule: Partial<UserRule>) => {
		const newRules = [...rules];
		newRules[index] = { ...newRules[index], ...updatedRule };
		onChange(newRules);
	};

	const removeRule = (index: number) => {
		// Clean up local state when removing a rule
		setBatchTextValues((prev) => {
			const newValues = { ...prev };
			delete newValues[index];
			// Shift indices down for rules after the removed one
			const shiftedValues: Record<number, string> = {};
			Object.entries(newValues).forEach(([key, value]) => {
				const numKey = Number(key);
				if (numKey > index) {
					shiftedValues[numKey - 1] = value;
				} else {
					shiftedValues[numKey] = value;
				}
			});
			return shiftedValues;
		});
		onChange(rules.filter((_, i) => i !== index));
	};

	const updateBatchText = (index: number, rawValue: string) => {
		// Update local state for textarea display
		setBatchTextValues((prev) => ({ ...prev, [index]: rawValue }));

		// Process the value for the rule
		const batchValues = rawValue
			.split('\n')
			.map((v) => v.trim())
			.filter(Boolean);

		updateRule(index, { batchValues });
	};

	useEffect(() => {
		const initialValues: Record<number, string> = {};
		rules.forEach((rule, index) => {
			if (rule.batch && rule.batchValues?.length) {
				initialValues[index] = rule.batchValues.join('\n');
			}
		});
		if (Object.keys(initialValues).length > 0) {
			setBatchTextValues((prev) => ({ ...prev, ...initialValues }));
		}
	}, [rules]);

	if (rules.length === 0) {
		return (
			<div className="rounded border border-primary/30 border-dashed bg-primary/5 p-8 text-center">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<FlagIcon className="h-6 w-6 text-primary" weight="duotone" />
				</div>
				<h3 className="mb-2 font-medium text-sm">No targeting rules</h3>
				<p className="mb-4 text-muted-foreground text-xs">
					Add rules to target specific users, emails, or properties
				</p>
				<Button
					className="rounded"
					onClick={addRule}
					size="sm"
					type="button"
					variant="outline"
				>
					<PlusIcon className="mr-2 h-4 w-4" size={16} />
					Add First Rule
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{rules.map((rule, index) => {
				const ruleId = `rule-${index}`;
				const supportsBatch = canUseBatch(rule);

				return (
					<div className="rounded border bg-card p-4" key={index}>
						{/* Rule Header */}
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
									{index + 1}
								</div>
								<span className="font-medium text-sm">
									{rule.type === 'user_id' && 'User ID'}
									{rule.type === 'email' && 'Email'}
									{rule.type === 'property' && 'Property'}
									{rule.type === 'percentage' && 'Percentage'}
									{rule.batch && ' (Batch)'}
								</span>
							</div>
							<Button
								onClick={() => removeRule(index)}
								size="sm"
								type="button"
								variant="ghost"
							>
								Remove
							</Button>
						</div>

						{/* Rule Configuration */}
						<div className="space-y-4">
							{/* Target Type & Batch Toggle */}
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div>
									<label
										className="mb-1 block font-medium text-sm"
										htmlFor={`${ruleId}-type`}
									>
										Target Type
									</label>
									<Select
										onValueChange={(value) => {
											const newType = value as UserRule['type'];
											updateRule(index, {
												type: newType,
												batch: newType === 'percentage' ? false : rule.batch,
												operator:
													newType === 'percentage' ? 'equals' : rule.operator,
											});
										}}
										value={rule.type}
									>
										<SelectTrigger id={`${ruleId}-type`}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="user_id">User ID</SelectItem>
											<SelectItem value="email">Email</SelectItem>
											<SelectItem value="property">Custom Property</SelectItem>
											<SelectItem value="percentage">
												Percentage Rollout
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{supportsBatch && (
									<div>
										<label
											className="mb-1 block font-medium text-sm"
											htmlFor={`${ruleId}-batch-toggle`}
										>
											Mode
										</label>
										<div className="flex items-center gap-2 rounded border p-2">
											<Switch
												checked={rule.batch}
												id={`${ruleId}-batch-toggle`}
												onCheckedChange={(batch) =>
													updateRule(index, { batch })
												}
											/>
											<span className="font-medium text-sm">
												{rule.batch ? 'Batch Mode' : 'Single Value'}
											</span>
										</div>
									</div>
								)}
							</div>

							{/* Property Field */}
							{rule.type === 'property' && (
								<div>
									<label
										className="mb-1 block font-medium text-sm"
										htmlFor={`${ruleId}-field`}
									>
										Property Name
									</label>
									<Input
										id={`${ruleId}-field`}
										onChange={(e) =>
											updateRule(index, { field: e.target.value })
										}
										placeholder="e.g. plan, role, country"
										value={rule.field || ''}
									/>
								</div>
							)}

							{/* Condition & Value */}
							{rule.type === 'percentage' ? (
								<div>
									<label
										className="mb-1 block font-medium text-sm"
										htmlFor={`${ruleId}-percentage`}
									>
										Percentage of Users
									</label>
									<div className="flex items-center gap-2">
										<Input
											id={`${ruleId}-percentage`}
											max="100"
											min="0"
											onChange={(e) =>
												updateRule(index, { value: Number(e.target.value) })
											}
											placeholder="50"
											type="number"
											value={rule.value || ''}
										/>
										<span className="font-medium text-sm">%</span>
									</div>
									<p className="mt-1 text-muted-foreground text-xs">
										{rule.value || 0}% of users will match this rule
									</p>
								</div>
							) : rule.batch ? (
								<div>
									<label
										className="mb-1 block font-medium text-sm"
										htmlFor={`${ruleId}-batch`}
									>
										{rule.type === 'user_id' && 'User IDs'}
										{rule.type === 'email' && 'Email Addresses'}
										{rule.type === 'property' && 'Property Values'}
										{' (one per line)'}
									</label>
									<Textarea
										id={`${ruleId}-batch`}
										onChange={(e) => updateBatchText(index, e.target.value)}
										placeholder={
											rule.type === 'user_id'
												? 'user_123\nuser_456\nuser_789'
												: rule.type === 'email'
													? 'user@example.com\nadmin@company.com\ntest@domain.org'
													: 'premium\nenterprise\nvip'
										}
										rows={4}
										value={
											batchTextValues[index] ||
											rule.batchValues?.join('\n') ||
											''
										}
									/>
									<p className="mt-1 text-muted-foreground text-xs">
										{rule.batchValues?.length || 0} values entered
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<div>
										<label
											className="mb-1 block font-medium text-sm"
											htmlFor={`${ruleId}-operator`}
										>
											Condition
										</label>
										<Select
											onValueChange={(value) =>
												updateRule(index, { operator: value as any })
											}
											value={rule.operator}
										>
											<SelectTrigger id={`${ruleId}-operator`}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="equals">Equals</SelectItem>
												<SelectItem value="contains">Contains</SelectItem>
												<SelectItem value="starts_with">Starts with</SelectItem>
												<SelectItem value="ends_with">Ends with</SelectItem>
												<SelectItem value="in">Is one of</SelectItem>
												<SelectItem value="not_in">Is not one of</SelectItem>
												{rule.type === 'property' && (
													<>
														<SelectItem value="exists">Exists</SelectItem>
														<SelectItem value="not_exists">
															Does not exist
														</SelectItem>
													</>
												)}
											</SelectContent>
										</Select>
									</div>

									{rule.operator !== 'exists' &&
										rule.operator !== 'not_exists' && (
											<div>
												<label
													className="mb-1 block font-medium text-sm"
													htmlFor={`${ruleId}-value`}
												>
													{rule.operator === 'in' || rule.operator === 'not_in'
														? 'Values (comma-separated)'
														: 'Value'}
												</label>
												{rule.operator === 'in' ||
												rule.operator === 'not_in' ? (
													<Input
														id={`${ruleId}-value`}
														onChange={(e) => {
															const values = e.target.value
																.split(',')
																.map((v) => v.trim())
																.filter(Boolean);
															updateRule(index, { values });
														}}
														placeholder="value1, value2, value3"
														value={rule.values?.join(', ') || ''}
													/>
												) : (
													<Input
														id={`${ruleId}-value`}
														onChange={(e) =>
															updateRule(index, { value: e.target.value })
														}
														placeholder="Enter value"
														value={rule.value || ''}
													/>
												)}
											</div>
										)}
								</div>
							)}

							{/* Result */}
							<div className="flex items-center justify-between rounded bg-muted/30 p-3">
								<span className="font-medium text-sm">
									When this rule matches:
								</span>
								<div className="flex items-center gap-2">
									<span
										className={
											rule.enabled ? 'text-muted-foreground' : 'font-medium'
										}
									>
										Disabled
									</span>
									<Switch
										checked={rule.enabled}
										onCheckedChange={(enabled) =>
											updateRule(index, { enabled })
										}
									/>
									<span
										className={
											rule.enabled ? 'font-medium' : 'text-muted-foreground'
										}
									>
										Enabled
									</span>
								</div>
							</div>
						</div>
					</div>
				);
			})}

			<Button
				className="w-full rounded border-2 border-primary/30 border-dashed transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
				onClick={addRule}
				type="button"
				variant="outline"
			>
				<PlusIcon className="mr-2 h-4 w-4" size={16} />
				Add Another Rule
			</Button>
		</div>
	);
}
