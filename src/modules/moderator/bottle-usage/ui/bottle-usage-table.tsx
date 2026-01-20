import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BottleUsage } from "@/db/schema";
import { UseQueryResult } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type Props = {
  totalBottlesQuery: UseQueryResult<
    | {
      success: true;
      totalBottles: {
        damaged_bottles: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total_bottles: number;
        available_bottles: number;
        used_bottles: number;
        deposit_bottles: number;
      };
    }
    | {
      success: false;
      error: string;
    },
    Error
  >;
  bottleUsageQuery: UseQueryResult<
    void | typeof BottleUsage.$inferSelect | null,
    Error
  >;
};

export const BottleUsageTable = ({
  totalBottlesQuery,
  bottleUsageQuery,
}: Props) => {
  const loading = bottleUsageQuery.isLoading || totalBottlesQuery.isLoading;

  return (
    <div className="pb-10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Available</TableHead>
            <TableHead>Filled</TableHead>
            <TableHead>Sale</TableHead>
            <TableHead>Empty</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Returned</TableHead>
            <TableHead className="text-right">Caps</TableHead>
            <TableHead>Done</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin size-6 text-muted-foreground" />
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              <TableCell className="font-medium">
                {totalBottlesQuery?.data?.success
                  ? totalBottlesQuery.data?.totalBottles.available_bottles
                  : 0}
              </TableCell>
              <TableCell>
                {bottleUsageQuery.data?.filled_bottles ?? (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {bottleUsageQuery.data?.sales ?? (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {bottleUsageQuery.data?.empty_bottles ?? (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {bottleUsageQuery.data?.remaining_bottles ?? (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {bottleUsageQuery.data?.returned_bottles ?? (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {bottleUsageQuery.data?.caps ?? (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {bottleUsageQuery.data?.done ? "✅" : "❌"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
