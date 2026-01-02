"use client";

import {
  closestCenter,
  DndContext,
  DraggableAttributes,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
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
import * as React from "react";

import { MiscellaneousTableCellViewer } from "@/modules/admin/deliveries/ui/misc-table-cell-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Miscellaneous, Moderator } from "@/db/schema";
import { format, startOfDay } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type columnSchema = {
  Moderator: typeof Moderator.$inferSelect;
  Miscellaneous: typeof Miscellaneous.$inferSelect;
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
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <div className="flex items-center justify-center">
  //       <Checkbox
  //         checked={
  //           table.getIsAllPageRowsSelected() ||
  //           (table.getIsSomePageRowsSelected() && "indeterminate")
  //         }
  //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //         aria-label="Select all"
  //       />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className="flex items-center justify-center">
  //       <Checkbox
  //         checked={row.getIsSelected()}
  //         onCheckedChange={(value) => row.toggleSelected(!!value)}
  //         aria-label="Select row"
  //       />
  //     </div>
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      return <MiscellaneousTableCellViewer item={row.original} />;
    },
    enableHiding: false,
    accessorFn: (row) => row.Miscellaneous.customer_name,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="w-full">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {format(row.original.Miscellaneous.createdAt, "PPPP")}
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
          startOfDay(row.original.Miscellaneous.createdAt) ? (
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
    accessorKey: "isPaid",
    header: "Paid",
    cell: ({ row }) => (
      <>
        {row.original.Miscellaneous.isPaid ? (
          <Badge variant={"outline"} className={"border-green-200"}>
            Yes
          </Badge>
        ) : (
          <Badge variant={"outline"} className={"border-red-200"}>
            No
          </Badge>
        )}
      </>
    ),
  },
  {
    accessorKey: "payment",
    header: () => <div className="w-full text-center">Payment</div>,
    cell: ({ row }) => (
      <div className="text-right">{row.original.Miscellaneous.payment}</div>
    ),
  },
  {
    accessorKey: "filled_bottles",
    header: () => <div className="w-full text-center">Filled</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.Miscellaneous.filled_bottles}
      </div>
    ),
  },
  {
    accessorKey: "empty_bottles",
    header: () => <div className="w-full text-center">Empty</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.Miscellaneous.empty_bottles}
      </div>
    ),
  },
  {
    accessorKey: "damaged_bottles",
    header: () => <div className="w-full text-center">Damage</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.Miscellaneous.damaged_bottles}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const desc = row.original.Miscellaneous.description;
      return (
        <div>
          <Tooltip>
            <TooltipTrigger>
              {desc.length > 20 ? `${desc.slice(0, 20)}...` : desc}
            </TooltipTrigger>
            <TooltipContent>
              <p>{desc}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
    enableHiding: false,
    accessorFn: (row) => row.Miscellaneous.description,
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
    id: row.original.Miscellaneous.id,
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

export function DataTable4MiscDeliveries({
  data = [],
}: {
  data?: columnSchema[];
}) {
  // ✅ single source of truth
  const [tableData, setTableData] = React.useState<columnSchema[]>(data);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sortableId = React.useId();

  const [fromDate, setFromDate] = React.useState<string | null>(null);
  const [toDate, setToDate] = React.useState<string | null>(null);

  // ✅ keep state in sync when prop changes
  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  // ✅ DATE FILTER
  const dateFilteredData = React.useMemo(() => {
    if (!fromDate && !toDate) return tableData;

    const from = fromDate ? startOfDay(new Date(fromDate)) : null;
    const to = toDate ? startOfDay(new Date(toDate)) : null;

    return tableData.filter(({ Miscellaneous }) => {
      const rowDate = startOfDay(new Date(Miscellaneous.createdAt));

      if (from && to) return rowDate >= from && rowDate <= to;
      if (from) return rowDate >= from;
      if (to) return rowDate <= to;

      return true;
    });
  }, [tableData, fromDate, toDate]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const dataIds = React.useMemo(
    () => dateFilteredData.map((d) => d.Miscellaneous.id),
    [dateFilteredData]
  );

  const table = useReactTable({
    data: dateFilteredData, // ✅ IMPORTANT
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.Miscellaneous.id.toString(),
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
    globalFilterFn: (row, _columnId, value) => {
      if (!value) return true;

      const search = String(value).toLowerCase().trim();

      const customer =
        row.original.Miscellaneous.customer_name?.toLowerCase() || "";
      const moderator =
        row.original.Moderator.name?.toLowerCase() || "";
      const description =
        row.original.Miscellaneous.description?.toLowerCase() || "";

      return (
        customer.includes(search) ||
        moderator.includes(search) ||
        description.includes(search)
      );
    },
  });




  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setTableData((prev) => {
      const oldIndex = prev.findIndex(
        (item) => item.Miscellaneous.id === active.id
      );
      const newIndex = prev.findIndex(
        (item) => item.Miscellaneous.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return prev;

      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function downloadCSV() {
    if (!table) return;

    const csvColumns = [
      "Customer",
      "Date",
      "Status",
      "Moderator",
      "Paid",
      "Payment",
      "Filled",
      "Empty",
      "Damage",
      "Description",
    ];

    const rows = table.getRowModel().rows.map((row) => {
      const { Miscellaneous, Moderator } = row.original;

      const rowData = [
        `"${(Miscellaneous.customer_name ?? "").replace(/"/g, '""')}"`,
        `"${format(new Date(Miscellaneous.delivery_date ?? Miscellaneous.createdAt), "PPPP")}"`,
        `"${Miscellaneous.isPaid ? "Done" : "Pending"}"`,
        `"${(Moderator.name ?? "").replace(/"/g, '""')}"`,
        `"${Miscellaneous.isPaid}"`,
        `"${Miscellaneous.payment ?? ""}"`,
        `"${Miscellaneous.filled_bottles ?? ""}"`,
        `"${Miscellaneous.empty_bottles ?? ""}"`,
        `"${Miscellaneous.damaged_bottles ?? ""}"`,
        `"${(Miscellaneous.description ?? "").replace(/"/g, '""')}"`,
      ];

      return rowData.join(",");
    });

    const csvContent = [csvColumns.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Miscellaneous Deliveries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <div className={""}>
      <div className="w-full px-4 pb-4 lg:px-6 space-y-4">
        {/* Top Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {/* From Date */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={fromDate ?? ""}
                max={toDate ?? undefined}
                onChange={(e) => setFromDate(e.target.value || null)}
                className="w-full sm:w-[150px]"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={toDate ?? ""}
                min={fromDate ?? undefined}
                onChange={(e) => setToDate(e.target.value || null)}
                className="w-full sm:w-[150px]"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setFromDate(today);
                  setToDate(today);
                }}
              >
                Today
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const last7 = new Date();
                  last7.setDate(today.getDate() - 6);

                  setFromDate(last7.toISOString().split("T")[0]);
                  setToDate(today.toISOString().split("T")[0]);
                }}
              >
                Last 7 Days
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setFromDate(null);
                  setToDate(null);
                }}
              >
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                Download CSV
              </Button>

            </div>

            {/* Search */}
            <Input
              placeholder="Search customer, moderator, notes..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>

          {/* Pagination + Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <div className="text-sm font-medium text-center sm:text-left">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                className="hidden lg:flex h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
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
                className="hidden lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight />
              </Button>
            </div>

            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <IconLayoutColumns />
                  <span className="hidden sm:inline">Customize Columns</span>
                  <IconChevronDown />
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
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
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
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
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
                {[10, 20, 30, 40, 50].map((pageSize) => (
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
