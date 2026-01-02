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
  IconGripVertical,
  IconLayoutColumns,
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
import { Customer } from "@/db/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ActionButton } from "./action-button";
import { CustomerInfoTableCellViewer } from "./customer-info-table-cell-viewer";

export type columnSchema = {
  Customer: typeof Customer.$inferSelect;
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
    header: "Name",
    cell: ({ row }) => {
      return <CustomerInfoTableCellViewer item={row.original} />;
    },
    enableHiding: false,
    accessorFn: (row) => row.Customer.name,
  },
  {
    accessorKey: "customer_id",
    header: "ID",
    cell: ({ row }) => {
      return <div>{row.original.Customer.customer_id}</div>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      return <div>{row.original.Customer.phone}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "text-muted-foreground px-1.5",
          row.original.Customer.isActive
            ? "text-emerald-500 border-green-200"
            : "text-rose-500 border-red-200"
        )}
      >
        {row.original.Customer.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "balance",
    header: "Balance",
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
    accessorKey: "bottles",
    header: "Empty",
    cell: ({ row }) => {
      return <div>{row.original.Customer.bottles}</div>;
    },
  },
  {
    accessorKey: "deposit",
    header: "Deposit",
    cell: ({ row }) => {
      return <div>{row.original.Customer.deposit}</div>;
    },
  },
  {
    accessorKey: "deposit_price",
    header: () => <div className="w-full min-w-[90px]">Deposit Price</div>,
    cell: ({ row }) => {
      return <div>{row.original.Customer.deposit_price}</div>;
    },
  },
  {
    accessorKey: "bottle_price",
    header: () => <div className="w-full min-w-[90px]">Bottle Price</div>,
    cell: ({ row }) => {
      return <div>{row.original.Customer.bottle_price}</div>;
    },
  },
  {
    accessorKey: "area",
    header: "Area",
    cell: ({ row }) => {
      return <div>{row.original.Customer.area}</div>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      return (
        <div className="min-w-[100px] whitespace-normal break-words">
          {row.original.Customer.address}
        </div>
      );
    },
  },
  {
    accessorKey: "customerSince",
    header: () => <div className="w-full min-w-[110px]">Customer Since</div>,
    cell: ({ row }) => (
      <div className="w-32 flex justify-center">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {format(row.original.Customer.customerSince, "PPP")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <ActionButton row={row} />,
    enableHiding: false,
    enableSorting: false,
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
    id: row.original.Customer.id,
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

export function DataTable6CustomerInformation({
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
  const [fromDate, setFromDate] = React.useState<string | null>(null);
  const [toDate, setToDate] = React.useState<string | null>(null);

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();

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
    () => data?.map(({ Customer }) => Customer.id) || [],
    [data]
  );


  const filteredData = React.useMemo(() => {
    if (!data) return [];

    return data.filter(({ Customer }) => {
      const customerDate = new Date(Customer.customerSince);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (customerDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (customerDate > to) return false;
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
    getRowId: (row) => row.Customer.id.toString(),
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
      const area = row.original.Customer?.area?.toLowerCase() || "";
      const id = row.original.Customer?.customer_id?.toLowerCase() || "";

      // Search across all relevant fields
      return (
        customerName.includes(searchValue) ||
        id.includes(searchValue) ||
        area.includes(searchValue)
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
      const oldIndex = data.findIndex((item) => item.Customer.id === active.id);
      const newIndex = data.findIndex((item) => item.Customer.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setData(arrayMove(data, oldIndex, newIndex));
      }
    }
  }


  function downloadCSV() {
    if (!data) return;

    const csvColumns = [
      "Name",
      "ID",
      "Phone",
      "Status",
      "Balance",
      "Empty",
      "Deposit",
      "Deposit Price",
      "Bottle Price",
      "Area",
    ];

    const rows = data.map(({ Customer }) => {
      const status = Customer.isActive ? "Active" : "Inactive";
      const balance =
        Customer.balance < 0
          ? `Advance: ${Math.abs(Customer.balance)}`
          : `Balance: ${Customer.balance}`;

      return [
        `"${Customer.name.replace(/"/g, '""')}"`,
        `"${Customer.customer_id}"`,
        `"${Customer.phone}"`,
        `"${status}"`,
        `"${balance}"`,
        `"${Customer.bottles}"`,
        `"${Customer.deposit}"`,
        `"${Customer.deposit_price}"`,
        `"${Customer.bottle_price}"`,
        `"${Customer.area}"`,
      ].join(",");
    });

    const csvContent = [csvColumns.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Customer Information.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <div className={""}>
      <div className="w-full flex items-center justify-between gap-4 px-4 pb-4 lg:px-6">
        <div className="flex flex-col gap-3 px-4 pb-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
  {/* LEFT */}
  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    <Input
      placeholder="Search Name / ID / Area..."
      value={globalFilter ?? ""}
      onChange={(e) => setGlobalFilter(e.target.value)}
      className="w-full sm:w-[260px]"
    />

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

    <Button
      variant="outline"
      size="sm"
      className="w-full sm:w-auto"
      onClick={downloadCSV}
    >
      Download CSV
    </Button>
  </div>

  {/* RIGHT */}
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
                column.toggleVisibility(!!value)
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
      <div className="overflow-hidden rounded-lg">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table className="min-w-full w-max caption-bottom text-sm">
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
