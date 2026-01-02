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
import { Delete, Ellipsis, Trash } from "lucide-react";
import { toast } from "sonner";
import { columnSchema } from "./data-table-2-bottle-inventory";

type Props = {
  row: Row<columnSchema>;
  isDelete: boolean;
};

export const ActionButton = ({ row, isDelete }: Props) => {
  const [ConfirmDialog, comfirm] = useConfirm(
    "Are you sure you want to reset this bottle usage?",
    "This action will reset all the fields associated with this bottle usage (may misbehave)",
    isDelete
  );

  const queryClient = useQueryClient();

  const resetMutation = useMutation(
    orpc.admin.bottleInventory.resetBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Bottle usage reset successfully");
        console.log("Bottle usage reset successfully");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.util.getTotalBottles.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.util.get30dBottleUsage.queryKey(),
          }),
        ]);
      },
      onError: (error) => {
        console.error(error);
        toast.error("Error resetting bottle usage");
      },
    })
  );
  const deleteMutation = useMutation(
    orpc.admin.bottleInventory.deleteBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Bottle usage deleted successfully");
        console.log("Bottle usage deleted successfully");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.util.getTotalBottles.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.util.get30dBottleUsage.queryKey(),
          }),
        ]);
      },
      onError: (error) => {
        console.error(error);
        toast.error("Error resetting bottle usage");
      },
    })
  );

  const handleReset = async (id: string) => {
    const ok = await comfirm();
    if (!ok) return;

    //call reset/delete mutation
    if (isDelete) {
      await deleteMutation.mutateAsync(id);
    } else {
      await resetMutation.mutateAsync(id);
    }
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
            onClick={() => handleReset(row.original.bottleUsage.id)}
          >
            {isDelete ? (
              <Trash className="size-4 text-rose-500" />
            ) : (
              <Delete className="size-4 text-rose-500" />
            )}
            <span className="text-rose-500">
              {isDelete ? "Delete" : "Reset"}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              (Warning)
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
