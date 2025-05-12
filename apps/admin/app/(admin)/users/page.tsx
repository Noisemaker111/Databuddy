import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, BadgeCheck, MoreHorizontal, UserPlus, Users, FileWarning } from "lucide-react";
import { getAllUsersAsAdmin } from "./actions";
import { format } from 'date-fns';
import Link from 'next/link';
import { getInitials } from "@/lib/utils";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { UserRow } from "./user-row";

// Expanded User type
interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  firstName: string | null;
  lastName: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  role: 'USER' | 'ADMIN';
  twoFactorEnabled: boolean | null;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const { users, error } = await getAllUsersAsAdmin();

  // Filter users based on search
  const filteredUsers = users?.filter((user) => {
    if (!search) return true;
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Card className="w-full max-w-md border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <FileWarning className="w-6 h-6 mr-2" />Error Fetching Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/90">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page or contact support if the issue persists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-muted/0 border-0 shadow-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 pb-2">
          <div className="flex items-center gap-4">
            <Users className="h-10 w-10 text-primary bg-primary/10 rounded-full p-2 shadow" />
            <div>
              <CardTitle className="text-3xl font-bold mb-1">Manage Users</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                View and manage all customer accounts on the platform.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md border-0 bg-gradient-to-br from-primary/5 to-muted/0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Found {filteredUsers?.length || 0} user{filteredUsers?.length === 1 ? '' : 's'}
                {search && ` matching "${search}"`}.
              </CardDescription>
            </div>
            <DataTableToolbar placeholder="Search users..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(!filteredUsers || filteredUsers.length === 0) ? (
            <div className="p-8 border rounded-lg bg-muted/20">
              <p className="text-center text-muted-foreground">
                {search 
                  ? `No users found matching "${search}". Try a different search term.`
                  : "No users found."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] pl-6">Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px] text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredUsers as User[]).map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </TableBody>
              {filteredUsers.length > 10 && (
                <TableCaption className="py-4 border-t mt-0">
                  Showing {filteredUsers.length} registered users. Pagination coming soon.
                </TableCaption>
              )}
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 