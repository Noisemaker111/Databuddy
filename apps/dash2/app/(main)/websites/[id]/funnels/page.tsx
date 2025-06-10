"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    RefreshCw,
    TrendingDown,
    Users,
    Target,
    Plus,
    BarChart3,
    Clock,
    ArrowRight,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Trash2,
    Edit,
    ChevronDown,
    MoreVertical,
    Eye,
    EyeOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/analytics/stat-card";
import { useWebsite } from "@/hooks/use-websites";
import { useAtom } from "jotai";
import {
    dateRangeAtom,
    timeGranularityAtom,
    formattedDateRangeAtom,
} from "@/stores/jotai/filterAtoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
    useFunnels,
    useFunnelAnalytics,
    type Funnel,
    type FunnelStep,
    type CreateFunnelData,
} from "@/hooks/use-funnels";

export default function FunnelsPage() {
    const { id } = useParams();
    const websiteId = id as string;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedFunnelId, setExpandedFunnelId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
    const [deletingFunnelId, setDeletingFunnelId] = useState<string | null>(null);
    const [newFunnel, setNewFunnel] = useState<CreateFunnelData>({
        name: '',
        description: '',
        steps: [
            { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
            { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
        ]
    });

    const [,] = useAtom(dateRangeAtom);
    const [currentGranularity] = useAtom(timeGranularityAtom);
    const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);

    const memoizedDateRangeForTabs = useMemo(() => ({
        start_date: formattedDateRangeState.startDate,
        end_date: formattedDateRangeState.endDate,
        granularity: currentGranularity,
    }), [formattedDateRangeState, currentGranularity]);

    const { data: websiteData } = useWebsite(websiteId);

    // Only fetch funnels list initially - no analytics
    const {
        data: funnels,
        isLoading: funnelsLoading,
        error: funnelsError,
        refetch: refetchFunnels,
        createFunnel,
        updateFunnel,
        deleteFunnel,
        isCreating,
        isUpdating,
    } = useFunnels(websiteId);

    // Only load analytics when a funnel is expanded
    const {
        data: analyticsData,
        isLoading: analyticsLoading,
        error: analyticsError,
        refetch: refetchAnalytics
    } = useFunnelAnalytics(
        websiteId,
        expandedFunnelId || '',
        memoizedDateRangeForTabs,
        { enabled: !!expandedFunnelId }
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const promises: Promise<any>[] = [refetchFunnels()];

            if (expandedFunnelId) {
                promises.push(refetchAnalytics());
            }

            await Promise.all(promises);
        } catch (error) {
            console.error("Failed to refresh funnel data:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchFunnels, refetchAnalytics, expandedFunnelId]);

    const handleCreateFunnel = async () => {
        try {
            await createFunnel(newFunnel);
            setIsCreateDialogOpen(false);
            resetNewFunnel();
        } catch (error) {
            console.error("Failed to create funnel:", error);
        }
    };

    const handleUpdateFunnel = async () => {
        if (!editingFunnel) return;

        try {
            await updateFunnel({
                funnelId: editingFunnel.id,
                updates: {
                    name: editingFunnel.name,
                    description: editingFunnel.description,
                    steps: editingFunnel.steps
                }
            });
            setIsEditDialogOpen(false);
            setEditingFunnel(null);
        } catch (error) {
            console.error("Failed to update funnel:", error);
        }
    };

    const handleDeleteFunnel = async (funnelId: string) => {
        try {
            await deleteFunnel(funnelId);
            if (expandedFunnelId === funnelId) {
                setExpandedFunnelId(null);
            }
            setDeletingFunnelId(null);
        } catch (error) {
            console.error("Failed to delete funnel:", error);
        }
    };

    const handleToggleFunnel = (funnelId: string) => {
        setExpandedFunnelId(expandedFunnelId === funnelId ? null : funnelId);
    };

    const resetNewFunnel = () => {
        setNewFunnel({
            name: '',
            description: '',
            steps: [
                { type: 'PAGE_VIEW' as const, target: '/', name: 'Landing Page' },
                { type: 'PAGE_VIEW' as const, target: '/signup', name: 'Sign Up Page' }
            ]
        });
    };

    const addStep = (isEditing = false) => {
        if (isEditing) {
            setEditingFunnel(prev => prev ? ({
                ...prev,
                steps: [...prev.steps, { type: 'PAGE_VIEW' as const, target: '', name: '' }]
            }) : prev);
        } else {
            setNewFunnel(prev => ({
                ...prev,
                steps: [...prev.steps, { type: 'PAGE_VIEW' as const, target: '', name: '' }]
            }));
        }
    };

    const removeStep = (index: number, isEditing = false) => {
        const funnel = isEditing ? editingFunnel : newFunnel;

        if (funnel && funnel.steps.length > 2) {
            if (isEditing) {
                setEditingFunnel(prev => prev ? ({
                    ...prev,
                    steps: prev.steps.filter((_, i) => i !== index)
                }) : prev);
            } else {
                setNewFunnel(prev => ({
                    ...prev,
                    steps: prev.steps.filter((_, i) => i !== index)
                }));
            }
        }
    };

    const updateStep = (index: number, field: keyof FunnelStep, value: string, isEditing = false) => {
        if (isEditing) {
            setEditingFunnel(prev => prev ? ({
                ...prev,
                steps: prev.steps.map((step, i) =>
                    i === index ? { ...step, [field]: value } : step
                )
            }) : prev);
        } else {
            setNewFunnel(prev => ({
                ...prev,
                steps: prev.steps.map((step, i) =>
                    i === index ? { ...step, [field]: value } : step
                )
            }));
        }
    };

    // Calculate summary stats from analytics data
    const summaryStats = useMemo(() => {
        if (!analyticsData?.data?.steps_analytics) {
            return {
                totalUsers: 0,
                overallConversion: 0,
                avgCompletionTime: 0,
                biggestDropoffRate: 0
            };
        }

        const steps = analyticsData.data.steps_analytics;
        const firstStep = steps[0];
        const lastStep = steps[steps.length - 1];

        return {
            totalUsers: firstStep?.users || 0,
            overallConversion: firstStep?.users > 0 ? ((lastStep?.users || 0) / firstStep.users) * 100 : 0,
            avgCompletionTime: analyticsData.data.avg_completion_time || 0,
            biggestDropoffRate: Math.max(...steps.map(step => step.dropoff_rate || 0))
        };
    }, [analyticsData]);

    const formatCompletionTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    const isLoading = funnelsLoading || isRefreshing;

    // Remove unused variables
    const showAnalytics = (funnel: Funnel) => expandedFunnelId === funnel.id && analyticsData;

    if (funnelsError) {
        return (
            <div className="p-6 max-w-[1600px] mx-auto">
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <p className="text-red-600 font-medium">Error loading funnel data</p>
                        </div>
                        <p className="text-red-600/80 text-sm mt-2">{funnelsError.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Conversion Funnels</h1>
                    <p className="text-muted-foreground">
                        Track user journeys through your conversion goals and optimize drop-off points
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Funnel
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded">
                            <DialogHeader>
                                <DialogTitle>Create New Funnel</DialogTitle>
                                <DialogDescription>
                                    Define a series of steps to track user conversion through your website
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Funnel Name</Label>
                                        <Input
                                            id="name"
                                            value={newFunnel.name}
                                            onChange={(e) => setNewFunnel(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Sign Up Flow"
                                            className="rounded"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={newFunnel.description}
                                            onChange={(e) => setNewFunnel(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Optional description"
                                            className="rounded"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Funnel Steps</Label>
                                    <div className="space-y-3 mt-2">
                                        {newFunnel.steps.map((step, index) => (
                                            <div key={index} className="flex items-center gap-2 p-3 border rounded">
                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 grid grid-cols-3 gap-2">
                                                    <Select
                                                        value={step.type}
                                                        onValueChange={(value) => updateStep(index, 'type', value)}
                                                    >
                                                        <SelectTrigger className="rounded">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded">
                                                            <SelectItem value="PAGE_VIEW">Page View</SelectItem>
                                                            <SelectItem value="EVENT">Event</SelectItem>
                                                            <SelectItem value="CUSTOM">Custom</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder={step.type === 'PAGE_VIEW' ? '/page-path' : 'event_name'}
                                                        value={step.target}
                                                        onChange={(e) => updateStep(index, 'target', e.target.value)}
                                                        className="rounded"
                                                    />
                                                    <Input
                                                        placeholder="Step name"
                                                        value={step.name}
                                                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                                                        className="rounded"
                                                    />
                                                </div>
                                                {newFunnel.steps.length > 2 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removeStep(index)}
                                                        className="rounded"
                                                    >
                                                        ×
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 rounded"
                                        onClick={() => addStep()}
                                        disabled={newFunnel.steps.length >= 10}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Step
                                    </Button>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                        className="rounded"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateFunnel}
                                        disabled={!newFunnel.name || newFunnel.steps.some(s => !s.name || !s.target) || isCreating}
                                        className="rounded"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Funnel'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Funnels Grid with Expandable Analytics */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Funnels</h2>
                    <div className="text-sm text-muted-foreground">
                        {funnels.length} funnel{funnels.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {funnelsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="animate-pulse rounded">
                                <CardHeader>
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-3 bg-muted rounded w-1/2"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-muted rounded"></div>
                                        <div className="h-3 bg-muted rounded w-2/3"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : funnels.length === 0 ? (
                    <Card className="border-dashed rounded">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Target className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No funnels yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first funnel to start tracking user conversion journeys
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 rounded">
                                <Plus className="h-4 w-4" />
                                Create Your First Funnel
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {funnels.map((funnel) => {
                            const isExpanded = expandedFunnelId === funnel.id;
                            const hasAnalytics = showAnalytics(funnel);

                            return (
                                <Card
                                    key={funnel.id}
                                    className={`transition-all duration-200 ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'} rounded cursor-pointer`}
                                    onClick={() => handleToggleFunnel(funnel.id)}
                                >
                                    {/* Funnel Header - Always Visible */}
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CardTitle className="text-lg leading-6 truncate">
                                                        {funnel.name}
                                                    </CardTitle>
                                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={funnel.isActive ? "default" : "secondary"} className="text-xs">
                                                        {funnel.isActive ? (
                                                            <>
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {funnel.steps.length} steps
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions Dropdown - Simplified */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 rounded flex-shrink-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingFunnel(funnel);
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit Funnel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingFunnelId(funnel.id);
                                                        }}
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete Funnel
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Description and Steps Flow */}
                                        <div className="mt-3 space-y-2">
                                            {funnel.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {funnel.description}
                                                </p>
                                            )}

                                            {/* Steps Flow - Now in its own row */}
                                            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                                {funnel.steps.map((step, index) => (
                                                    <div key={index} className="flex items-center gap-1 flex-shrink-0">
                                                        <div className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-200 dark:border-blue-800 whitespace-nowrap" title={step.name}>
                                                            {step.name}
                                                        </div>
                                                        {index < funnel.steps.length - 1 && (
                                                            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Analytics Content */}
                                    {isExpanded && (
                                        <div className="border-t bg-muted/10">
                                            <CardContent className="pt-6">
                                                {analyticsLoading ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                                                        <span>Loading analytics...</span>
                                                    </div>
                                                ) : analyticsError ? (
                                                    <div className="py-6">
                                                        <div className="flex items-center gap-2 text-destructive mb-2">
                                                            <TrendingDown className="h-4 w-4" />
                                                            <span className="font-medium">Error loading analytics</span>
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">{analyticsError.message}</p>
                                                    </div>
                                                ) : hasAnalytics ? (
                                                    <div className="space-y-6">
                                                        {/* Summary Stats */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <StatCard
                                                                title="Users Entered"
                                                                value={summaryStats.totalUsers.toLocaleString()}
                                                                icon={Users}
                                                                isLoading={analyticsLoading}
                                                                description="Started the funnel journey"
                                                            />
                                                            <StatCard
                                                                title="Overall Conversion"
                                                                value={`${summaryStats.overallConversion.toFixed(1)}%`}
                                                                icon={Target}
                                                                isLoading={analyticsLoading}
                                                                description="Completed entire funnel"
                                                            />
                                                            <StatCard
                                                                title="Avg Completion Time"
                                                                value={formatCompletionTime(summaryStats.avgCompletionTime)}
                                                                icon={Clock}
                                                                isLoading={analyticsLoading}
                                                                description="Time to complete funnel"
                                                            />
                                                            <StatCard
                                                                title="Biggest Drop-off Rate"
                                                                value={`${summaryStats.biggestDropoffRate.toFixed(1)}%`}
                                                                icon={TrendingDown}
                                                                isLoading={analyticsLoading}
                                                                description="Worst performing step"
                                                            />
                                                        </div>

                                                        {/* Performance Insights */}
                                                        {(summaryStats.overallConversion < 10 || summaryStats.overallConversion > 50) && (
                                                            <div className="flex gap-4">
                                                                {summaryStats.overallConversion < 10 && (
                                                                    <Card className="flex-1 border-orange-200 dark:border-orange-800 rounded">
                                                                        <CardContent className="p-4">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                                                <span className="text-sm font-medium">Low Conversion Alert</span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                This funnel has a low conversion rate. Consider optimizing steps with high drop-offs.
                                                                            </p>
                                                                        </CardContent>
                                                                    </Card>
                                                                )}

                                                                {summaryStats.overallConversion > 50 && (
                                                                    <Card className="flex-1 border-green-200 dark:border-green-800 rounded">
                                                                        <CardContent className="p-4">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                                <span className="text-sm font-medium">High Performance</span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                This funnel is performing excellently with a high conversion rate.
                                                                            </p>
                                                                        </CardContent>
                                                                    </Card>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Visual Funnel Flow */}
                                                        {analyticsData?.data?.steps_analytics && (
                                                            <Card className="rounded">
                                                                <CardHeader>
                                                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                                        <Target className="h-4 w-4" />
                                                                        Funnel Visualization
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="space-y-4">
                                                                        {analyticsData.data.steps_analytics.map((step, index) => {
                                                                            const isFirstStep = index === 0;
                                                                            const conversionRate = step.conversion_rate || 0;
                                                                            const dropoffRate = step.dropoff_rate || 0;

                                                                            return (
                                                                                <div key={step.step_number} className="relative">
                                                                                    <div className="flex items-center gap-3 p-3 rounded border">
                                                                                        {/* Step Number */}
                                                                                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-sm font-medium">
                                                                                            {step.step_number}
                                                                                        </div>

                                                                                        {/* Step Info */}
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                <div>
                                                                                                    <h5 className="font-medium text-sm">{step.step_name}</h5>
                                                                                                    <p className="text-xs text-muted-foreground">
                                                                                                        Step {step.step_number}
                                                                                                        {step.avg_time_to_complete && (
                                                                                                            <span className="ml-2">• {formatCompletionTime(step.avg_time_to_complete)}</span>
                                                                                                        )}
                                                                                                    </p>
                                                                                                </div>
                                                                                                <div className="text-right">
                                                                                                    <div className="font-semibold text-sm">
                                                                                                        {step.users?.toLocaleString()}
                                                                                                    </div>
                                                                                                    <div className="text-xs text-muted-foreground">
                                                                                                        {((step.users / summaryStats.totalUsers) * 100).toFixed(1)}%
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Progress bar */}
                                                                                            <div className="space-y-1">
                                                                                                <Progress
                                                                                                    value={(step.users / summaryStats.totalUsers) * 100}
                                                                                                    className="h-1.5"
                                                                                                />
                                                                                                <div className="flex justify-between text-xs">
                                                                                                    <span className="text-muted-foreground">
                                                                                                        {!isFirstStep && (
                                                                                                            <Badge variant={conversionRate > 70 ? "default" : conversionRate > 40 ? "secondary" : "destructive"} className="text-xs">
                                                                                                                {conversionRate.toFixed(1)}%
                                                                                                            </Badge>
                                                                                                        )}
                                                                                                    </span>
                                                                                                    {dropoffRate > 0 && (
                                                                                                        <span className="text-muted-foreground text-xs">
                                                                                                            Drop-off: {step.dropoffs?.toLocaleString()} ({dropoffRate.toFixed(1)}%)
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Arrow to next step */}
                                                                                    {index < analyticsData.data.steps_analytics.length - 1 && (
                                                                                        <div className="flex justify-center py-2">
                                                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </CardContent>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingFunnelId} onOpenChange={() => setDeletingFunnelId(null)}>
                <AlertDialogContent className="rounded">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Funnel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this funnel? This action cannot be undone and will permanently remove all associated analytics data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingFunnelId && handleDeleteFunnel(deletingFunnelId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded"
                        >
                            Delete Funnel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded">
                    <DialogHeader>
                        <DialogTitle>Edit Funnel</DialogTitle>
                        <DialogDescription>
                            Update funnel configuration and steps
                        </DialogDescription>
                    </DialogHeader>
                    {editingFunnel && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-name">Funnel Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingFunnel.name}
                                        onChange={(e) => setEditingFunnel(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                                        placeholder="e.g., Sign Up Flow"
                                        className="rounded"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Input
                                        id="edit-description"
                                        value={editingFunnel.description || ''}
                                        onChange={(e) => setEditingFunnel(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                                        placeholder="Optional description"
                                        className="rounded"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Funnel Steps</Label>
                                <div className="space-y-3 mt-2">
                                    {editingFunnel.steps.map((step, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 border rounded">
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                                <Select
                                                    value={step.type}
                                                    onValueChange={(value) => updateStep(index, 'type', value, true)}
                                                >
                                                    <SelectTrigger className="rounded">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded">
                                                        <SelectItem value="PAGE_VIEW">Page View</SelectItem>
                                                        <SelectItem value="EVENT">Event</SelectItem>
                                                        <SelectItem value="CUSTOM">Custom</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder={step.type === 'PAGE_VIEW' ? '/page-path' : 'event_name'}
                                                    value={step.target}
                                                    onChange={(e) => updateStep(index, 'target', e.target.value, true)}
                                                    className="rounded"
                                                />
                                                <Input
                                                    placeholder="Step name"
                                                    value={step.name}
                                                    onChange={(e) => updateStep(index, 'name', e.target.value, true)}
                                                    className="rounded"
                                                />
                                            </div>
                                            {editingFunnel.steps.length > 2 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeStep(index, true)}
                                                    className="rounded"
                                                >
                                                    ×
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 rounded"
                                    onClick={() => addStep(true)}
                                    disabled={editingFunnel.steps.length >= 10}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Step
                                </Button>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setEditingFunnel(null);
                                    }}
                                    className="rounded"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateFunnel}
                                    disabled={!editingFunnel.name || editingFunnel.steps.some(s => !s.name || !s.target) || isUpdating}
                                    className="rounded"
                                >
                                    {isUpdating ? 'Updating...' : 'Update Funnel'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 