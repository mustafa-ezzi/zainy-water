"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";

import { ActionButton } from "@/modules/admin/add-moderator/ui/action-button";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, SquareArrowOutUpRight } from "lucide-react";

import { orpc } from "@/lib/orpc";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { GeneratedAvatar } from "@/lib/avatar";
import { Area } from "@/db/schema";

// Moderator type
export type Moderator = {
  id: string;
  name: string;
  password: string;
  areas: (typeof Area.enumValues)[number][];
  isWorking: boolean;
};

// Columns
export const columns: ColumnDef<Moderator>[] = [
  {
    accessorKey: "serial_number",
    header: "S.No.",
    cell: ({ row }) => <div>{row.index + 1}.</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const setMod = useModeratorStore((s) => s.setModerator);
      const router = useRouter();
      return (
        <div className="flex items-center gap-2">
          <GeneratedAvatar seed={row.original.name} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="link"
                className="p-0 capitalize"
                onClick={() => {
                  setMod(row.original);
                  router.push("/moderator");
                }}
              >
                {row.original.name}
                <SquareArrowOutUpRight className="ml-1 size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open moderator panel</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "password",
    header: "Password",
    cell: ({ row }) => (
      <span className="font-mono">{row.original.password}</span>
    ),

  },
  {
    accessorKey: "areas",
    header: "Areas",
    cell: ({ row }) => (
      <Accordion type="single" collapsible className="w-[160px]">
        <AccordionItem value="areas">
          <AccordionTrigger>Areas</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1">
              {row.original.areas.map((area, i) => (
                <li key={i} className="text-sm list-disc list-inside">
                  {area}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    accessorKey: "revenue",
    header: "Sales / Expenses",
    cell: ({ row }) => {
      const { data } = useQuery(
        orpc.admin.crudModerator.getSalesAndExpenses.queryOptions({
          input: row.original.name,
        })
      );

      return (
        <div>
          {data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
              <span className="font-medium">Sales:</span>
              <span>{data.sales}</span>
              <span className="font-medium">Expenses:</span>
              <span>{data.expenses}</span>
            </div>
          ) : (
            "Loading..."
          )}
        </div>
      );
    }

  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div
        className={`px-3 py-1 rounded-full text-xs text-center font-semibold w-fit ${row.original.isWorking
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
          }`}
      >
        {row.original.isWorking ? "Working" : "Removed"}
      </div>
    ),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <ActionButton row_data={row.original} />,
    enableHiding: false,
  },
];

// Main Table Component
export function ModeratorTable({ data }: { data: Moderator[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className="px-4 py-2 text-left text-sm font-medium text-gray-700"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
