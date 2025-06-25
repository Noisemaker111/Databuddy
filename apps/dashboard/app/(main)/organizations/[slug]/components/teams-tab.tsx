"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    UsersIcon,
    PlusIcon,
    TrashIcon,
    EnvelopeIcon,
    UserIcon,
    CrownIcon,
    ClockIcon
} from "@phosphor-icons/react";
import { useOrganizationMembers, useOrganizationInvitations } from "@/hooks/use-organizations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface TeamsTabProps {
    organization: any;
}

interface MemberToRemove {
    id: string;
    name: string;
}

interface InvitationToCancel {
    id: string;
    email: string;
}

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
    <div className="p-4 rounded border border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 border border-primary/20">
                <Icon size={16} weight="duotone" className="h-5 w-5 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
            </div>
        </div>
    </div>
);

export function TeamsTab({ organization }: TeamsTabProps) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
    const [memberToRemove, setMemberToRemove] = useState<MemberToRemove | null>(null);
    const [invitationToCancel, setInvitationToCancel] = useState<InvitationToCancel | null>(null);
    const [showInviteDialog, setShowInviteDialog] = useState(false);

    const {
        members,
        isLoading: isLoadingMembers,
        inviteMember,
        removeMember,
        isInvitingMember,
        isRemovingMember,
    } = useOrganizationMembers(organization.id);

    const {
        invitations,
        isLoading: isLoadingInvitations,
        cancelInvitation
    } = useOrganizationInvitations(organization.id);

    const activeInvitations = invitations?.filter(inv => inv.status === "pending") || [];
    const totalMembers = (members?.length || 0) + activeInvitations.length;

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) return;

        try {
            await inviteMember({
                email: inviteEmail.trim(),
                role: inviteRole,
                organizationId: organization.id
            });
            setInviteEmail("");
            setShowInviteDialog(false);
            toast.success("Invitation sent successfully");
        } catch (error) {
            toast.error("Failed to send invitation");
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            await removeMember(memberToRemove.id);
            toast.success("Member removed successfully");
            setMemberToRemove(null);
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    const handleCancelInvitation = async () => {
        if (!invitationToCancel) return;

        try {
            await cancelInvitation(invitationToCancel.id);
            toast.success("Invitation cancelled");
            setInvitationToCancel(null);
        } catch (error) {
            toast.error("Failed to cancel invitation");
        }
    };

    if (isLoadingMembers || isLoadingInvitations) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded" />
                <Skeleton className="h-48 w-full rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={UsersIcon} label="Active Members" value={members?.length || 0} />
                <StatCard icon={EnvelopeIcon} label="Pending Invites" value={activeInvitations.length} />
                <StatCard icon={CrownIcon} label="Total Team Size" value={totalMembers} />
            </div>

            <div className="flex justify-end">
                <Button onClick={() => setShowInviteDialog(true)} className="rounded">
                    <PlusIcon size={16} className="h-4 w-4 mr-2" />
                    Invite Team Member
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UsersIcon size={16} weight="duotone" className="h-5 w-5" />
                        Team Members
                    </h3>
                    <Badge variant="outline" className="px-2 py-1">
                        {members?.length || 0} active
                    </Badge>
                </div>

                {members && members.length > 0 ? (
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="p-4 rounded border border-border/50 bg-muted/30 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border border-border/50">
                                        <AvatarImage src={member.user.image || undefined} alt={member.user.name} />
                                        <AvatarFallback className="text-sm bg-accent font-medium">
                                            {member.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{member.user.name}</p>
                                            {member.role === "owner" && (
                                                <CrownIcon size={16} className="h-4 w-4 text-amber-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <ClockIcon size={16} className="h-3 w-3" />
                                            Joined {dayjs(member.createdAt).fromNow()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={member.role === "owner" ? "default" : "secondary"}
                                        className={cn(
                                            "px-2 py-1",
                                            member.role === "owner" && "bg-amber-100 text-amber-800 border-amber-200"
                                        )}
                                    >
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </Badge>
                                    {member.role !== "owner" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                            onClick={() => setMemberToRemove({ id: member.id, name: member.user.name })}
                                            disabled={isRemovingMember}
                                        >
                                            <TrashIcon size={16} className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border border-border/50 rounded bg-muted/30">
                        <UserIcon size={32} weight="duotone" className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No team members yet</p>
                    </div>
                )}
            </div>

            {activeInvitations.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <EnvelopeIcon size={16} weight="duotone" className="h-5 w-5" />
                            Pending Invitations
                        </h3>
                        <Badge variant="outline" className="px-2 py-1">
                            {activeInvitations.length} pending
                        </Badge>
                    </div>
                    <div className="space-y-3">
                        {activeInvitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="p-4 rounded border border-border/50 bg-muted/30 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-accent border border-border/50">
                                        <EnvelopeIcon size={16} className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{invitation.email}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Invited as {invitation.role} • {invitation.status}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <ClockIcon size={16} className="h-3 w-3" />
                                            Expires {dayjs(invitation.expiresAt).fromNow()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="px-2 py-1 capitalize">
                                        {invitation.status}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                        onClick={() => setInvitationToCancel({ id: invitation.id, email: invitation.email })}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                            Send an invitation to add a new member to this organization.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dialog-invite-email">Email Address</Label>
                            <Input
                                id="dialog-invite-email"
                                type="email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="rounded"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && inviteEmail.trim()) {
                                        handleInviteMember();
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dialog-invite-role">Role</Label>
                            <Select value={inviteRole} onValueChange={(value: "admin" | "member") => setInviteRole(value)}>
                                <SelectTrigger className="rounded">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowInviteDialog(false)}
                            className="rounded"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInviteMember}
                            disabled={!inviteEmail.trim() || isInvitingMember}
                            className="rounded"
                        >
                            {isInvitingMember ? (
                                <>
                                    <div className="w-3 h-3 rounded-full border border-primary-foreground/30 border-t-primary-foreground animate-spin mr-2" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <PlusIcon size={16} className="h-4 w-4 mr-2" />
                                    Send Invitation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from this organization?
                            This action cannot be undone and they will lose access to all organization resources.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove Member
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!invitationToCancel} onOpenChange={() => setInvitationToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the invitation for <strong>{invitationToCancel?.email}</strong>?
                            They will no longer be able to join this organization using this invitation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelInvitation}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Cancel Invitation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 