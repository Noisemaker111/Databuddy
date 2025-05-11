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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // For owner initials
import { Button } from "@/components/ui/button";
import { AlertCircle, Globe, MoreHorizontal, ExternalLink } from "lucide-react";
import { getAllWebsitesAsAdmin } from "./actions";
import { format } from 'date-fns';
import Link from 'next/link';
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { WebsiteActions } from "./website-actions";

// Define a type for the website data including owner info
interface WebsiteWithUser {
  id: string;
  name: string | null;
  domain: string | null; // Assuming this is the full display domain or subdomain.domain
  createdAt: Date | string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
}

// Helper function to get initials (can be moved to a shared util)
const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default async function AdminWebsitesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const { websites, error } = await getAllWebsitesAsAdmin();

  // Filter websites based on search
  const filteredWebsites = websites?.filter((website) => {
    if (!search) return true;
    return (
      website.name?.toLowerCase().includes(search) ||
      website.domain?.toLowerCase().includes(search) ||
      website.ownerName?.toLowerCase().includes(search) ||
      website.ownerEmail?.toLowerCase().includes(search)
    );
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Could not load websites.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-muted/0 border-0 shadow-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 pb-2">
          <div className="flex items-center gap-4">
            <Globe className="h-10 w-10 text-primary bg-primary/10 rounded-full p-2 shadow" />
            <div>
              <CardTitle className="text-3xl font-bold mb-1">Manage Websites</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                View and manage all websites on the platform.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md border-0 bg-gradient-to-br from-primary/5 to-muted/0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Websites</CardTitle>
              <CardDescription>
                Found {filteredWebsites?.length || 0} website{filteredWebsites?.length === 1 ? '' : 's'}
                {search && ` matching "${search}"`}.
              </CardDescription>
            </div>
            <DataTableToolbar placeholder="Search websites..." />
          </div>
        </CardHeader>
        <CardContent>
          {(!filteredWebsites || filteredWebsites.length === 0) ? (
            <div className="p-8 border rounded-lg bg-muted/20">
              <p className="text-center text-muted-foreground">
                {search 
                  ? `No websites found matching "${search}". Try a different search term.`
                  : "No websites found."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Website Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredWebsites as WebsiteWithUser[]).map((website) => (
                  <TableRow key={website.id}>
                    <TableCell className="font-medium">
                      {website.name || "Untitled Website"}
                    </TableCell>
                    <TableCell>
                      {website.domain ? (
                        <a 
                          href={`http://${website.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:underline flex items-center"
                        >
                          {website.domain} <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </a>
                      ) : "N/A"}
                    </TableCell>
                    <TableCell>
                      {website.userId || website.ownerEmail ? (
                        <Link href={`/users/${encodeURIComponent(website.userId || website.ownerEmail || "")}`} className="flex items-center gap-2 group">
                          <Avatar className="h-8 w-8 text-xs group-hover:ring-2 group-hover:ring-primary">
                            <AvatarFallback>{getInitials(website.ownerName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm group-hover:underline">{website.ownerName || "Unknown User"}</div>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 text-xs">
                            <AvatarFallback>{getInitials(website.ownerName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{website.ownerName || "Unknown User"}</div>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">{website.ownerEmail || "-"}</div>
                    </TableCell>
                    <TableCell>{format(new Date(website.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <WebsiteActions website={website} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {filteredWebsites.length > 10 && (
                <TableCaption className="py-4 border-t mt-0">
                  Showing {filteredWebsites.length} websites. Pagination coming soon.
                </TableCaption>
              )}
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 