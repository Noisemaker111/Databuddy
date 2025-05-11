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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink, BadgeCheck, AlertCircle, ShieldQuestion, Globe, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
          <CardDescription>Could not load domains.</CardDescription>
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
              <CardTitle className="text-3xl font-bold mb-1">Manage Domains</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                View and manage all domains and their associated websites.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md border-0 bg-gradient-to-br from-primary/5 to-muted/0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Domains</CardTitle>
              <CardDescription>
                Found {filteredDomains?.length || 0} domain{filteredDomains?.length === 1 ? '' : 's'}
                {search && ` matching "${search}"`}.
              </CardDescription>
            </div>
            <DataTableToolbar placeholder="Search domains..." />
          </div>
        </CardHeader>
        <CardContent>
          {(!filteredDomains || filteredDomains.length === 0) ? (
            <div className="p-8 border rounded-lg bg-muted/20">
              <p className="text-center text-muted-foreground">
                {search 
                  ? `No domains found matching "${search}". Try a different search term.`
                  : "No domains found."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDomains.map((domain) => (
                <Collapsible key={domain.id} className="border rounded-lg">
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{domain.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {domain.websites?.length || 0} website{domain.websites?.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {domain.verifiedAt ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-500/20">
                          <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                          Verified
                        </Badge>
                      ) : domain.verificationStatus === "PENDING" ? (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-500/20">
                          <ShieldQuestion className="mr-1 h-3.5 w-3.5" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                          <AlertCircle className="mr-1 h-3.5 w-3.5" />
                          {domain.verificationStatus || "Unknown"}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Website</TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Added</TableHead>
                          <TableHead className="w-[50px]"/>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {domain.websites?.map((website) => (
                          <TableRow key={website.id}>
                            <TableCell>
                              <Link 
                                href={`/websites/${website.id}`}
                                className="font-medium hover:underline flex items-center"
                              >
                                {website.name}
                                <ExternalLink className="ml-1 h-3.5 w-3.5" />
                              </Link>
                            </TableCell>
                            <TableCell>
                              <a
                                href={`http://${website.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline flex items-center"
                              >
                                {website.domain}
                                <ExternalLink className="ml-1 h-3.5 w-3.5" />
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge variant={website.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {website.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {domain.userId || domain.ownerEmail ? (
                                <Link href={`/users/${encodeURIComponent(domain.userId || domain.ownerEmail || "")}`} className="flex items-center gap-2 group">
                                  <Avatar className="h-8 w-8 text-xs group-hover:ring-2 group-hover:ring-primary">
                                    <AvatarImage src={domain.ownerImage || undefined} alt={domain.ownerName || "User"} />
                                    <AvatarFallback>{getInitials(domain.ownerName)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm group-hover:underline">{domain.ownerName || "Unknown User"}</div>
                                    <div className="text-xs text-muted-foreground">{domain.ownerEmail || "-"}</div>
                                  </div>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8 text-xs">
                                    <AvatarFallback>?</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">Unknown User</div>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(website.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <DomainActions domain={domain} />
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!domain.websites || domain.websites.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                              No websites using this domain
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 