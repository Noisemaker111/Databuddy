import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileWarning } from "lucide-react";
import { getAllUsersAsAdmin } from "./actions";
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
  role: 'ADMIN' | 'USER' | 'EARLY_ADOPTER' | 'INVESTOR' | 'BETA_TESTER' | 'GUEST';
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
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <FileWarning className="w-5 h-5 mr-2" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            {filteredUsers?.length || 0} user{filteredUsers?.length === 1 ? '' : 's'}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <DataTableToolbar placeholder="Search users..." />
      </div>

      <Card>
        <CardContent className="p-0">
          {(!filteredUsers || filteredUsers.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground">
              {search 
                ? `No users found matching "${search}"`
                : "No users found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredUsers as User[]).map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 