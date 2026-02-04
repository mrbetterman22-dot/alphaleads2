"use client";

import { useData } from "@/context/data-provider";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, ExternalLink } from "lucide-react";

export function RecentTransactions() {
  // We now pull 'leads' instead of 'transactions' from our data provider
  const { leads } = useData();

  // Show only the 5 most recent leads
  const recentLeads = leads?.slice(0, 5) || [];

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Business
          </TableHead>
          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Opportunity
          </TableHead>
          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentLeads.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center py-10 text-muted-foreground"
            >
              No leads found yet. Add a monitor to start scanning.
            </TableCell>
          </TableRow>
        ) : (
          recentLeads.map((lead) => (
            <TableRow key={lead.id} className="group border-none">
              <TableCell className="py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-sm group-hover:text-[#ffe600] transition-colors">
                    {lead.business_name}
                  </span>
                  <div className="flex items-center text-[10px] text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3" />
                    Google Maps Lead
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border-none text-[10px] font-bold uppercase"
                >
                  {lead.opportunity_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs font-medium">
                    {lead.is_unlocked ? "Unlocked" : "Locked"}
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
