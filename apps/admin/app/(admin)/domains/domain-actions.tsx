'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { checkDomainVerification, regenerateVerificationToken, deleteDomain } from "./actions";

interface Domain {
  id: string;
  name: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  verifiedAt: string | null;
}

interface DomainActionsProps {
  domain: Domain;
}

export function DomainActions({ domain }: DomainActionsProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await checkDomainVerification(domain.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data?.verified) {
        toast.success("Domain verified successfully");
      } else {
        toast.error(result.data?.message || "Domain verification failed");
      }
    } catch (error) {
      console.error("Error verifying domain:", error);
      toast.error("Failed to verify domain");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegenerateToken = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateVerificationToken(domain.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Verification token regenerated");
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast.error("Failed to regenerate token");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDomain(domain.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Domain deleted successfully");
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast.error("Failed to delete domain");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Domain Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {domain.verificationStatus === "PENDING" && (
            <>
              <DropdownMenuItem onClick={handleVerify} disabled={isVerifying}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {isVerifying ? "Verifying..." : "Verify Domain"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRegenerateToken} disabled={isRegenerating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRegenerating ? "Regenerating..." : "Regenerate Token"}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Domain"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Domain"
        description={`Are you sure you want to delete ${domain.name}? This action cannot be undone.`}
      />
    </>
  );
} 