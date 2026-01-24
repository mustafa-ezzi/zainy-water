"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Miscellaneous } from "@/db/schema";
import { client } from "@/lib/orpc";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

export const MiscDeliveryTable = () => {
  const [miscDeliveries, setMiscDeliveries] = useState<
    (typeof Miscellaneous.$inferSelect)[]
  >([]);
  const [loading, setLoading] = useState(false);
  const moderator = useModeratorStore((state) => state.moderator);
  const dob = useDOBStore((state) => state.dob);

  const fetchDeliveries = async () => {
    if (!moderator) {
      toast.error("Moderator not found");
      return;
    }

    if (!dob) {
      toast.error("Date of Bottle Usage not set");
      return;
    }

    setLoading(true);

    const miscData =
      await client.moderator.miscellaneous.getMiscDeliveriesByMod({
        id: moderator.id,
        dob: dob,
      });

    setLoading(false);

    if (!!miscData) {
      setMiscDeliveries(miscData);
    } else {
      console.error("Failed to fetch miscellaneous deliveries");
      toast.error(
        "Failed to fetch miscellaneous deliveries. Please try again."
      );
    }
  };

  return (
    <div>
      <div className="w-full flex justify-end mb-4">
        <Button variant={"outline"} onClick={fetchDeliveries}>
          {miscDeliveries.length > 0 ? "Refresh" : "Show"} List
          {loading && <Loader2 className="animate-spin" />}
        </Button>
      </div>
      <div className="bg-background overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-9 py-2 min-w-37.5">Date</TableHead>
              <TableHead className="h-9 py-2 min-w-[150px]">
                Customer Name
              </TableHead>
              <TableHead className="h-9 py-2 min-w-[150px]">
                Description
              </TableHead>
              <TableHead className="h-9 py-2 min-w-[100px]">Filled</TableHead>
              <TableHead className="h-9 py-2 min-w-[100px]">Empty</TableHead>
              <TableHead className="h-9 py-2 min-w-[100px]">Damaged</TableHead>
              <TableHead className="h-9 py-2 min-w-[100px]">Payment</TableHead>
              <TableHead className="h-9 py-2 min-w-[100px]">FOC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {miscDeliveries.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin size-6" />
                    </div>
                  ) : (
                    "No results"
                  )}
                </TableCell>
              </TableRow>
            )}
            {miscDeliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="py-2 font-medium">
                  {format(delivery.delivery_date, "PPP")}
                </TableCell>
                <TableCell className="py-2">{delivery.customer_name}</TableCell>
                <TableCell className="py-2">{delivery.description}</TableCell>
                <TableCell className="py-2">
                  {delivery.filled_bottles}
                </TableCell>
                <TableCell className="py-2">{delivery.empty_bottles}</TableCell>
                <TableCell className="py-2">
                  {delivery.damaged_bottles}
                </TableCell>
                <TableCell className="py-2">Rs. {delivery.payment}</TableCell>
                <TableCell className="py-2">
                  {delivery.isPaid ? "No" : "Yes"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        List of miscellaneous deliveries added today.
      </p>
    </div>
  );
};
