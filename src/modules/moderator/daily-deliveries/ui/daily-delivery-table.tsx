"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { format } from "date-fns";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Customer, Delivery } from "@/db/schema";
import { useConfirm } from "@/hooks/use-confirm";
import { client, orpc } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

export type DeliveryTableData = {
  delivery: typeof Delivery.$inferSelect;
  customer: typeof Customer.$inferSelect;
};

export const DailyDeliveryTable = () => {
  const [ConfirmDialogue, confirm] = useConfirm(
    "Are you sure?",
    "WARNING: You are about to delete this delivery record. This action cannot be undone.",
    true
  );

  const [listLoading, setListLoading] = useState(false);

  const [deliveries, setDeliveries] = useState<DeliveryTableData[]>([]);
  const moderator = useModeratorStore((state) => state.moderator);

  const dob = useDOBStore((state) => state.dob);

  const fetchDeliveries = async () => {
    if (!moderator?.id) {
      toast.error("Moderator not found");
      return;
    }

    if (!dob) {
      toast.error("Please select a date to fetch deliveries");
      return;
    }

    setListLoading(true);
    // Fetch deliveries for the current moderator
    const delivery_data = await client.moderator.deliveries.getDailyDeliveries({
      moderator_id: moderator.id,
      date: dob,
    });

    setListLoading(false);

    if (!delivery_data) return;

    setDeliveries(
      delivery_data.map((entry) => ({
        delivery: entry.Delivery,
        customer: entry.Customer,
      }))
    );
  };

  const deleteMutation = useMutation(
    orpc.moderator.deliveries.deleteDailyDelivery.mutationOptions({
      onSuccess: () => {
        toast.success("Delivery deleted successfully");
      },
      onError: (error) => {
        toast.error(`Failed to delete delivery: ${error.message}`);
        console.error("Failed to delete delivery", { error });
      },
    })
  );

  const handleDeleteDelivery = async (delivery: DeliveryTableData) => {
    if (!moderator?.id) {
      toast.error("Moderator not found");
      return;
    }

    const ok = await confirm();
    if (!ok) return;

    await deleteMutation.mutateAsync({
      moderator_id: moderator.id,
      data: delivery,
    });

    await fetchDeliveries();
  };

  return (
    <div className="w-full max-w-full">
      <ConfirmDialogue />
      <div className="w-full flex justify-end mb-4">
        <Button variant={"outline"} onClick={fetchDeliveries} className="">
          {deliveries.length > 0 ? "Refresh" : "Show"} List
          {listLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>
      <div className="bg-background overflow-x-auto rounded-md border">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-9 py-2 min-w-[100px]">Date</TableHead>
              <TableHead className="h-9 py-2 min-w-[150px]">C.Code</TableHead>
              <TableHead className="h-9 py-2 min-w-[120px]">Name</TableHead>
              <TableHead className="h-9 py-2 min-w-[150px]">Address</TableHead>
              <TableHead className="h-9 py-2 min-w-[60px]">Filled</TableHead>
              <TableHead className="h-9 py-2 min-w-[60px]">Empty</TableHead>
              <TableHead className="h-9 py-2 min-w-[60px]">FOC</TableHead>
              <TableHead className="h-9 py-2 min-w-[60px]">Damaged</TableHead>
              <TableHead className="h-9 py-2 min-w-[80px]">Payment</TableHead>
              <TableHead className="h-9 py-2">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  {listLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin size-6" />
                    </div>
                  ) : (
                    "No results"
                  )}
                </TableCell>
              </TableRow>
            )}
            {deliveries.map(({ delivery, customer }) => (
              <TableRow key={delivery.id}>
                <TableCell className="py-2 min-w-[100px] whitespace-nowrap">
                  {format(delivery.delivery_date, "PPP")}
                </TableCell>
                <TableCell className="py-2 min-w-[150px] whitespace-nowrap">
                  {delivery.customer_id}
                </TableCell>
                <TableCell className="py-2 min-w-[120px]">
                  <div className="truncate max-w-[120px]" title={customer.name}>
                    {customer.name}
                  </div>
                </TableCell>
                <TableCell className="py-2 min-w-[150px]">
                  <div
                    className="truncate max-w-[200px]"
                    title={customer.address}
                  >
                    {customer.address}
                  </div>
                </TableCell>
                <TableCell className="py-2 min-w-[60px] text-center">
                  {delivery.filled_bottles}
                </TableCell>
                <TableCell className="py-2 min-w-[60px] text-center">
                  {delivery.empty_bottles}
                </TableCell>
                <TableCell className="py-2 min-w-[60px] text-center">
                  {delivery.foc}
                </TableCell>
                <TableCell className="py-2 min-w-[60px] text-center">
                  {delivery.damaged_bottles}
                </TableCell>
                <TableCell className="py-2 min-w-[80px] whitespace-nowrap">
                  Rs. {delivery.payment}
                </TableCell>
                <TableCell className="py-2 whitespace-nowrap flex justify-center">
                  <Button
                    variant={"ghost"}
                    onClick={() => handleDeleteDelivery({ delivery, customer })}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2
                        className={"animate-spin size-4 text-rose-400"}
                      />
                    ) : (
                      <Trash2 className={"text-rose-500 size-4"} />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Delivery History for today
      </p>
    </div>
  );
};
