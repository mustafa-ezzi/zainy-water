"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
  DraggableAttributes,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
} from "@tabler/icons-react";
import { Trash, Loader2 } from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Customer, Delivery, Moderator } from "@/db/schema";
import { format, startOfDay } from "date-fns";
import { DeliveriesTableCellViewer } from "@/modules/admin/deliveries/ui/deliveries-table-cell-viewer";
import { orpc } from "@/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";

export type columnSchema = {
  Moderator: typeof Moderator.$inferSelect;
  Customer: typeof Customer.$inferSelect;
  Delivery: typeof Delivery.$inferSelect;
};

// Create a separate component for the drag handle
function DragHandle({
  attributes,
  listeners,
}: {
  attributes: DraggableAttributes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners: any;
}) {
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns: ColumnDef<columnSchema>[] = [
  {
    id: "drag",
    header: () => null,
    cell: () => null,
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      return <DeliveriesTableCellViewer item={row.original} />;
    },
    enableHiding: false,
    accessorFn: (row) => row.Customer.name,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="w-full">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {format(row.original.Delivery.delivery_date, "PPPP")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5 w-full">
        {startOfDay(new Date()) >
          startOfDay(row.original.Delivery.delivery_date) ? (
          <>
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />{" "}
            Done
          </>
        ) : (
          <>
            <IconLoader /> Today&apos;s Delivery
          </>
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "moderator",
    header: "Moderator",
    cell: ({ row }) => {
      return (
        <div className={"capitalize w-full"}>{row.original.Moderator.name}</div>
      );
    },
    enableHiding: false,
    accessorFn: (row) => row.Moderator.name,
  },
  {
    accessorKey: "payment",
    header: () => <div className="w-full text-center">Payment</div>,
    cell: ({ row }) => (
      <div className="text-right">{row.original.Delivery.payment}</div>
    ),
  },
  {
    accessorKey: "is_online",
    header: () => <div className="w-full text-center">Payment Mode</div>,
    cell: ({ row }) => {
      const isOnline = row.original.Delivery.is_online;

      return (
        <div className="flex justify-center">
          {isOnline ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
              Online
            </Badge>
          ) : (
            <Badge className="bg-slate-500/10 text-slate-600 border-slate-200">
              Cash
            </Badge>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "balance",
    header: () => <div className="w-full text-center">Balance</div>,
    cell: ({ row }) => {
      return (
        <div>
          {row.original.Customer.balance < 0 ? (
            <Badge
              variant={"outline"}
              className="px-1.5 text-emerald-500 border-green-200"
            >
              Advance: {Math.abs(row.original.Customer.balance)}
            </Badge>
          ) : (
            <Badge
              variant={"outline"}
              className="px-1.5 text-rose-500 border-red-200"
            >
              Balance: {row.original.Customer.balance}
            </Badge>
          )}
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "filled_bottles",
    header: () => <div className="w-full text-center">Filled</div>,
    cell: ({ row }) => (
      <div className="text-right">{row.original.Delivery.filled_bottles}</div>
    ),
  },
  {
    accessorKey: "empty_bottles",
    header: () => <div className="w-full text-center">Empty</div>,
    cell: ({ row }) => (
      <div className="text-right">{row.original.Delivery.empty_bottles}</div>
    ),
  },
  {
    accessorKey: "damaged_bottles",
    header: () => <div className="w-full text-center">Damage</div>,
    cell: ({ row }) => (
      <div className="text-right">{row.original.Delivery.damaged_bottles}</div>
    ),
  },
  {
    id: "delete",
    header: () => <div className="w-full text-center">Action</div>,
    cell: ({ row }) => {
      return (
        <DeleteButton item={row.original} />
      );
    },
    enableHiding: false,
  },
];

function DraggableRow({ row }: { row: Row<columnSchema> }) {
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: row.original.Delivery.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-50 data-[dragging=true]:opacity-50 data-[dragging=true]:shadow-lg"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {cell.column.id === "drag" ? (
            <DragHandle attributes={attributes} listeners={listeners} />
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

function DeleteButton({ item }: { item: columnSchema }) {
  const queryClient = useQueryClient();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure you want to delete this delivery?",
    "This action cannot be undone.",
    true
  );

  const deleteMutation = useMutation(
    orpc.admin.deliveries.deleteDailyDelivery.mutationOptions({
      onSuccess: async () => {
        toast.success("Delivery deleted successfully");
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: orpc.util.get30dDeliveries.queryKey(),
          }),
        ]);
      },
      onError: (error) => {
        console.error(`Failed to delete delivery: ${error}`);
        toast.error(
          `Failed to delete delivery: ${error instanceof Error ? error.message : "Unknown error"
          }`
        );
      },
    })
  );

  const handleDelete = async () => {
    const ok = confirm();
    if (!ok) return;

    await deleteMutation.mutateAsync({ data: item });
  };

  return (
    <>
      <ConfirmDialog />
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        className="w-full"
      >
        {deleteMutation.isPending ? (
          <>
            Deleting
            <Loader2 className="size-4 animate-spin" />
          </>
        ) : (
          <>
            <Trash className="size-4" />
            Delete
          </>
        )}
      </Button>
    </>
  );
}

export function DataTable3DailyDeliveries({
  data: initialData,
}: {
  data?: columnSchema[];
}) {
  const [data, setData] = React.useState<columnSchema[] | undefined>(
    initialData
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();
  const [fromDate, setFromDate] = React.useState<string | null>(null);
  const [toDate, setToDate] = React.useState<string | null>(null);

  // Sync local state with prop changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ Delivery }) => Delivery.id) || [],
    [data]
  );


  const filteredData = React.useMemo(() => {
    if (!data) return [];

    return data.filter(({ Delivery }) => {
      const deliveryDate = startOfDay(new Date(Delivery.delivery_date));

      if (fromDate) {
        const from = startOfDay(new Date(fromDate));
        if (deliveryDate < from) return false;
      }

      if (toDate) {
        const to = startOfDay(new Date(toDate));
        if (deliveryDate > to) return false;
      }

      return true;
    });
  }, [data, fromDate, toDate]);


  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.Delivery.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, columnId, value) => {
      if (!value || value.length === 0) return true;

      const searchValue = String(value).toLowerCase().trim();
      if (!searchValue) return true;

      // Get values to search through
      const customerName = row.original.Customer?.name?.toLowerCase() || "";
      const moderatorName = row.original.Moderator?.name?.toLowerCase() || "";
      const customerId =
        row.original.Customer?.customer_id?.toLowerCase() || "";

      // Search across all relevant fields
      return (
        customerName.includes(searchValue) ||
        moderatorName.includes(searchValue) ||
        customerId.includes(searchValue)
      );
    },
  });

  // function handleDragEnd(event: DragEndEvent) {
  //   const { active, over } = event;
  //   if (active && over && active.id !== over.id) {
  //     setData((data) => {
  //       const oldIndex = dataIds.indexOf(active.id);
  //       const newIndex = dataIds.indexOf(over.id);
  //       return arrayMove(data, oldIndex, newIndex);
  //     });
  //   }
  // }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id && data) {
      const oldIndex = data.findIndex((item) => item.Delivery.id === active.id);
      const newIndex = data.findIndex((item) => item.Delivery.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setData(arrayMove(data, oldIndex, newIndex));
      }
    }
  }

  // Add this inside your DataTable3DailyDeliveries component, above the table rendering:

  function downloadCSV() {
    if (!data) return;

    const csvColumns = [
      "Customer",
      "Date",
      "Status",
      "Moderator",
      "Payment Mode", // 👈 add

      "Payment",
      "Balance",
      "Filled",
      "Empty",
      "Damage",
    ];

    const rows = data.map(({ Customer, Moderator, Delivery }) => {
      const status =
        startOfDay(new Date()) > startOfDay(Delivery.delivery_date)
          ? "Done"
          : "Today's Delivery";

      const balance =
        Customer.balance < 0
          ? `Advance: ${Math.abs(Customer.balance)}`
          : `Balance: ${Customer.balance}`;

      return [
        `"${Customer.name.replace(/"/g, '""')}"`,
        `"${format(new Date(Delivery.delivery_date), "PPPP")}"`,
        `"${status}"`,
        `"${Moderator.name.replace(/"/g, '""')}"`,
        `"${Delivery.is_online ? "Online" : "Cash"}"`, // 👈 here

        `"${Delivery.payment ?? ""}"`,
        `"${balance}"`,
        `"${Delivery.filled_bottles ?? ""}"`,
        `"${Delivery.empty_bottles ?? ""}"`,
        `"${Delivery.damaged_bottles ?? ""}"`,
      ].join(",");
    });

    const csvContent = [csvColumns.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Deliveries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <div className={""}>
      <div className="w-full flex items-center justify-between gap-4 px-4 pb-4 lg:px-6">
        <div className="flex flex-col gap-3 px-4 pb-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          {/* LEFT SIDE – SEARCH + DATE FILTERS */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Search */}
            <Input
              placeholder="Search Name / ID / Moderator"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full sm:w-[260px]"
            />

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={fromDate ?? ""}
                onChange={(e) => setFromDate(e.target.value || null)}
                className="w-full sm:w-[150px]"
              />

              <span className="hidden sm:inline text-muted-foreground text-sm">
                to
              </span>

              <Input
                type="date"
                value={toDate ?? ""}
                onChange={(e) => setToDate(e.target.value || null)}
                className="w-full sm:w-[150px]"
              />

              {(fromDate || toDate) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setFromDate(null);
                    setToDate(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* CSV */}
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={downloadCSV}
            >
              Download CSV
            </Button>
          </div>

          {/* RIGHT SIDE – PAGINATION + COLUMNS */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <div className="text-sm font-medium text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="hidden lg:flex"
              >
                <IconChevronsLeft />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="hidden lg:flex"
              >
                <IconChevronsRight />
              </Button>
            </div>

            {/* Columns */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <IconLayoutColumns className="size-4" />
                  <span className="hidden sm:inline">Columns</span>
                  <IconChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(value)
                      }
                      className="capitalize"
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>
      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredRowModel().rows.length} row(s).
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
