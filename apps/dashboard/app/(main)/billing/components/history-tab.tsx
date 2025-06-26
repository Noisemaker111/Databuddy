"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DownloadIcon, CircleOff } from "lucide-react"
import { useBillingData } from "../data/billing-data"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HistoryTab() {
  const { subscriptionData, isLoading } = useBillingData()

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  const history: any[] = (subscriptionData as any)?.history || []

  if (history.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-64 text-center">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-3">
            <CircleOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4">No Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your payment history will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item: any) => (
            <TableRow key={item.id}>
              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>{typeof item.amount === 'number' ? `$${item.amount.toFixed(2)}` : '-'}</TableCell>
              <TableCell>
                <Badge variant={item.status === "Paid" ? "default" : "destructive"}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
} 