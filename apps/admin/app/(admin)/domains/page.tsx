import { getAllDomainsAsAdmin } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ExternalLink, BadgeCheck, AlertCircle, Globe } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { DomainActions } from "./domain-actions";

interface Website {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  domain: string;
}

interface DomainEntry {
  id: string;
  name: string | null;
  verifiedAt: string | null;
  verificationStatus: string | null;
  createdAt: string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerImage: string | null;
  websites: Website[] | null;
}

export default async function AdminDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const { domains, error } = await getAllDomainsAsAdmin();

  // Filter domains based on search
  const filteredDomains = domains?.filter((domain) => {
    if (!search) return true;
    return (
      domain.name?.toLowerCase().includes(search) ||
      domain.ownerName?.toLowerCase().includes(search) ||
      domain.ownerEmail?.toLowerCase().includes(search) ||
      domain.websites?.some((w: Website) => w.name?.toLowerCase().includes(search))
    );
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
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
          <h1 className="text-2xl font-bold">Domains</h1>
          <p className="text-sm text-muted-foreground">
            {filteredDomains?.length || 0} domain{filteredDomains?.length === 1 ? '' : 's'}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <DataTableToolbar placeholder="Search domains..." />
      </div>

      <Card>
        <CardContent className="p-0">
          {(!filteredDomains || filteredDomains.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground">
              {search 
                ? `No domains found matching "${search}"`
                : "No domains found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">Websites</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{domain.name}</span>
                            {domain.verifiedAt ? (
                              <Badge variant="default" className="gap-1 h-5 px-1.5 text-xs">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            ) : domain.verificationStatus === "PENDING" ? (
                              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-xs">
                                <AlertCircle className="h-3 w-3" />
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1 h-5 px-1.5 text-xs">
                                <AlertCircle className="h-3 w-3" />
                                Failed
                              </Badge>
                            )}
                          </div>
                          <div className="md:hidden text-xs text-muted-foreground mt-1">
                            {domain.ownerName && `Owner: ${domain.ownerName}`}
                            {domain.websites && domain.websites.length > 0 && (
                              <span className="ml-2">{domain.websites.length} website{domain.websites.length === 1 ? '' : 's'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {domain.userId || domain.ownerEmail ? (
                        <Link href={`/users/${encodeURIComponent(domain.userId || domain.ownerEmail || "")}`} className="flex items-center gap-2 group max-w-[200px]">
                          <Avatar className="h-6 w-6 text-xs">
                            <AvatarImage src={domain.ownerImage || undefined} alt={domain.ownerName || "User"} />
                            <AvatarFallback className="text-[10px]">{getInitials(domain.ownerName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate group-hover:underline">{domain.ownerName || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground truncate">{domain.ownerEmail}</div>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {domain.websites && domain.websites.length > 0 ? (
                        <div className="space-y-1">
                          {domain.websites.slice(0, 2).map(website => (
                            <div key={website.id} className="flex items-center gap-1">
                              <Link 
                                href={`/websites/${website.id}`}
                                className="text-sm hover:underline truncate max-w-[150px]"
                              >
                                {website.name}
                              </Link>
                              <Badge variant={website.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs h-4">
                                {website.status}
                              </Badge>
                            </div>
                          ))}
                          {domain.websites.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{domain.websites.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(domain.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DomainActions domain={domain} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 