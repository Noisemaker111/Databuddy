'use client';

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreHorizontal, BadgeCheck, AlertCircle, Users, Shield, UserCheck } from "lucide-react";
import { format } from 'date-fns';
import Link from 'next/link';
import { getInitials } from "@/lib/utils";
import { forceVerifyUser, updateUserStatus } from "./actions";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date | string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  role: 'ADMIN' | 'USER' | 'EARLY_ADOPTER' | 'INVESTOR' | 'BETA_TESTER' | 'GUEST';
}

export function UserRow({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [showForceVerifyDialog, setShowForceVerifyDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('ACTIVE');
  const [isForceVerifyPending, startForceVerifyTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();

  const handleForceVerify = async () => {
    startForceVerifyTransition(async () => {
      const result = await forceVerifyUser(user.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User email force verified");
        setShowForceVerifyDialog(false);
      }
    });
  };

  const handleStatusChange = async () => {
    startStatusTransition(async () => {
      const result = await updateUserStatus(user.id, pendingStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`User ${pendingStatus.toLowerCase()}`);
        setShowStatusDialog(false);
      }
    });
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <Link href={`/users/${user.id}`} className="group">
              <Avatar className="h-8 w-8 text-xs group-hover:ring-2 group-hover:ring-primary">
                <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/users/${user.id}`} className="font-medium text-sm hover:underline truncate">
                  {user.name || "Unnamed User"}
                </Link>
                {user.emailVerified ? (
                  <BadgeCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                {user.role !== 'USER' && (
                  <Badge variant="secondary" className="text-xs h-4">
                    {user.role === 'ADMIN' ? 'Admin' : 
                     user.role === 'EARLY_ADOPTER' ? 'Early Adopter' :
                     user.role === 'INVESTOR' ? 'Investor' :
                     user.role === 'BETA_TESTER' ? 'Beta Tester' :
                     user.role === 'GUEST' ? 'Guest' : 
                     user.role}
                  </Badge>
                )}
              </div>
              <div className="md:hidden text-xs text-muted-foreground mt-1">
                {user.email}
                <span className="ml-2">
                  Status: {user.status.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <div className="flex items-center gap-2">
            <Badge 
              variant={user.status === 'ACTIVE' ? 'default' : user.status === 'SUSPENDED' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {user.status}
            </Badge>
            {!user.emailVerified && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                Unverified
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
          {format(new Date(user.createdAt), "MMM d, yyyy")}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={loading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/users/${user.id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              {!user.emailVerified && (
                <DropdownMenuItem onClick={() => setShowForceVerifyDialog(true)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Force Verify
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setPendingStatus(user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                  setShowStatusDialog(true);
                }}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Force Verify Dialog */}
      <AlertDialog open={showForceVerifyDialog} onOpenChange={setShowForceVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force verify email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <strong>{user.email}</strong> as verified without email confirmation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isForceVerifyPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceVerify}
              disabled={isForceVerifyPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isForceVerifyPending ? "Verifying..." : "Force Verify"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === 'SUSPENDED' ? 'Suspend user?' : 'Activate user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {pendingStatus === 'SUSPENDED' ? 'suspend' : 'activate'} <strong>{user.name || user.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStatusPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isStatusPending}
              className={pendingStatus === 'SUSPENDED' ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isStatusPending ? "Updating..." : (pendingStatus === 'SUSPENDED' ? 'Suspend' : 'Activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 