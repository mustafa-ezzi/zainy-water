import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { orpc } from "@/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Row } from "@tanstack/react-table";
import { Ellipsis, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { columnSchema } from "./data-table-6-customer-info";

type Props = {
  row: Row<columnSchema>;
};

export const ActionButton = ({ row }: Props) => {
  const [ConfirmDialog, comfirm] = useConfirm(
    "Are you sure you want to delete this customer?",
    "This customer and all the deliveries associated will be removed permanently",
    true
  );

  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    orpc.admin.customerInfo.deleteCustomer.mutationOptions({
      onSuccess: async () => {
        toast.success("Customer deleted successfully");
        console.log("Customer deleted successfully");
        await queryClient.invalidateQueries({
          queryKey: orpc.admin.customerInfo.getAllCustomers.queryKey(),
        });
      },
      onError: (error) => {
        console.error(error);
        toast.error("Error deleting customer");
      },
    })
  );

  const handleDelete = async (id: string) => {
    const ok = await comfirm();
    if (!ok) return;

    //call delete mutation
    await deleteMutation.mutateAsync({ id });
  };

  return (
    <div>
      <ConfirmDialog />
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2 rounded-md hover:bg-gray-100">
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => handleDelete(row.original.Customer.id)}
          >
            <Trash2 className="size-4 text-rose-500" />
            <span className="text-rose-500">Delete</span>
            <span className="text-xs font-mono text-muted-foreground">
              (Warning)
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
