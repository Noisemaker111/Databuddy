"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreateWebsiteData, Website } from "@/hooks/use-websites";
import { websiteApi } from "@/hooks/use-websites";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@databuddy/auth/client";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z
    .preprocess((val) => {
      if (typeof val !== "string") {
        return val;
      }
      let domain = val;
      if (domain.startsWith("http://") || domain.startsWith("https://")) {
        try {
          domain = new URL(domain).hostname;
        } catch {
          // if parsing fails, we fallback to the original value
        }
      }
      return domain.replace(/^www\./, "");
    }, z.string()
      .min(1, "Domain is required")
      .regex(
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/,
        "Invalid domain format"
      )),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteDialogProps {
  website?: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  onCreationSuccess?: () => void;
  onUpdateSuccess?: () => void;
}

export function WebsiteDialog({
  website,
  open,
  onOpenChange,
  onCreationSuccess,
  onUpdateSuccess,
}: WebsiteDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!website;
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const form = useForm<FormData>({
    defaultValues: {
      name: website?.name || "",
      domain: website?.domain || "",
    },
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const { mutate: createWebsite, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateWebsiteData) => {
      const endpoint = activeOrganization?.id
        ? `/websites?organizationId=${activeOrganization.id}`
        : "/websites";
      return websiteApi.create(endpoint, data);
    },
    onSuccess: () => {
      toast.success("Website created successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
      if (onCreationSuccess) {
        onCreationSuccess();
      }
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateWebsite, isPending: isUpdating } = useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      websiteApi.update(data.id, data.name),
    onSuccess: () => {
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: ["websites"] });
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (data: FormData) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (isEditing) {
      updateWebsite({ id: website.id, name: data.name });
    } else {
      createWebsite(data);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Website" : "New Website"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your website."
              : "Add a new website to start tracking analytics."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Site" {...field} ref={inputRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              disabled={isEditing}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                disabled={isCreating || isUpdating}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isCreating || isUpdating || !form.formState.isValid}
                type="submit"
              >
                {isCreating || isUpdating
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Website"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
