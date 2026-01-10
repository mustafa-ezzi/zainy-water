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
import { Moderator, OtherExpense } from "@/db/schema";
import { format, startOfDay } from "date-fns";
import { OtherExpTableCellViewer } from "./other-exp-table-cell-viewer";

export type columnSchema = {
  Moderator: typeof Moderator.$inferSelect;
  OtherExpense: typeof OtherExpense.$inferSelect;
};


function DragHandle({
  attributes,
  listeners,
}: {
  attributes: DraggableAttributes;

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
    accessorKey: "moderator",
    header: "Moderator",
    cell: ({ row }) => {
      return <OtherExpTableCellViewer item={row.original} />;
    },
    enableHiding: false,
    accessorFn: (row) => row.Moderator.name,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {format(row.original.OtherExpense.date, "PPPP")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {startOfDay(new Date()) >
          startOfDay(row.original.OtherExpense.date) ? (
          <>
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />{" "}
            Done
          </>
        ) : (
          <>
            <IconLoader /> Today&apos;s Expense
          </>
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      return (
        <div className={"text-center"}>{row.original.OtherExpense.amount}</div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div>{row.original.OtherExpense.description}</div>;
    },
  },
  {
    accessorKey: "refilled_bottles",
    header: "Refilled Bottles",
    cell: ({ row }) => {
      return (
        <div className={"text-center"}>
          {row.original.OtherExpense.refilled_bottles}
        </div>
      );
    },
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
    id: row.original.OtherExpense.id,
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

export function DataTable5OtherExpense({
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
  const [fromDate, setFromDate] = React.useState<string | null>(null);
  const [toDate, setToDate] = React.useState<string | null>(null);

  const sortableId = React.useId();


  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ OtherExpense }) => OtherExpense.id) || [],
    [data]
  );


  function downloadCSV() {
    if (!table) return;


    const visibleColumns = table
      .getAllColumns()
      .filter(col => ["moderator", "date", "status", "amount", "description", "refilled_bottles"].includes(col.id));


    const headers = visibleColumns.map(col => `"${col.id.replace("_", " ").toUpperCase()}"`);


    const rows = table.getRowModel().rows.map(row =>
      visibleColumns
        .map(col => {
          let cellValue: string | number = "";

          switch (col.id) {
            case "moderator":
              cellValue = row.original.Moderator.name;
              break;
            case "date":
              cellValue = format(new Date(row.original.OtherExpense.date), "PPPP");
              break;
            case "status":
              cellValue =
                startOfDay(new Date()) > startOfDay(row.original.OtherExpense.date)
                  ? "Done"
                  : "Today's Expense";
              break;
            case "amount":
              cellValue = row.original.OtherExpense.amount;
              break;
            case "description":
              cellValue = row.original.OtherExpense.description;
              break;
            case "refilled_bottles":
              cellValue = row.original.OtherExpense.refilled_bottles;
              break;
            default:
              cellValue = "";
          }


          return `"${String(cellValue).replace(/"/g, '""')}"`;
        })
        .join(",")
    );


    const csvContent = [headers.join(","), ...rows].join("\n");


    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }




  const dateFilteredData = React.useMemo(() => {
    if (!data) return [];
    const from = fromDate ? startOfDay(new Date(fromDate)) : null;
    const to = toDate ? startOfDay(new Date(toDate)) : null;

    return data.filter(({ OtherExpense }) => {
      const rowDate = startOfDay(new Date(OtherExpense.date));
      if (from && to) return rowDate >= from && rowDate <= to;
      if (from) return rowDate >= from;
      if (to) return rowDate <= to;
      return true;
    });
  }, [data, fromDate, toDate]);

  const table = useReactTable({
    data: dateFilteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.OtherExpense.id.toString(),
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
      const moderatorName = row.original.Moderator?.name?.toLowerCase() || "";
      const description =
        row.original.OtherExpense?.description?.toLowerCase() || "";
      return moderatorName.includes(searchValue) || description.includes(searchValue);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id && data) {
      const oldIndex = data.findIndex(
        (item) => item.OtherExpense.id === active.id
      );
      const newIndex = data.findIndex(
        (item) => item.OtherExpense.id === over.id
      );
      if (oldIndex !== -1 && newIndex !== -1) {
        setData(arrayMove(data, oldIndex, newIndex));
      }
    }
  }

  return (
    <div className="">
      { }
      <div className="w-full flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-4 px-4 pb-4 lg:px-6">
        { }
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 gap-3 w-full sm:w-auto">
          { }
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={fromDate ?? ""}
              max={toDate ?? undefined}
              onChange={(e) => setFromDate(e.target.value || null)}
              className="w-full sm:w-[150px]"
            />
          </div>

          { }
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={toDate ?? ""}
              min={fromDate ?? undefined}
              onChange={(e) => setToDate(e.target.value || null)}
              className="w-full sm:w-[150px]"
            />
          </div>

          { }
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
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
        </div>

        { }
        <div className="flex flex-col sm:flex-row sm:items-end sm:ml-auto w-full sm:w-auto">
          <Input
            placeholder="Search names..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:w-[250px]"
          />
        </div>
      </div>

      { }
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
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="">
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      { }
      <div className="flex items-center justify-between px-4 py-2">
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
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
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

          { }
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

