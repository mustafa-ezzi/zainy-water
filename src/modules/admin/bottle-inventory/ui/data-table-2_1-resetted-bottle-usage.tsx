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
import { BottleInventoryTableCellViewer } from "./bottle-inventory-table-cell-viewer";
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
import { BottleUsage, Moderator } from "@/db/schema";
import { format, startOfDay } from "date-fns";
import { ActionButton } from "./actions-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export type columnSchema = {
  bottleUsage: typeof BottleUsage.$inferSelect;
  moderator: typeof Moderator.$inferSelect;
};

const columns: ColumnDef<columnSchema>[] = [
  {
    id: "drag",
    header: () => null,
    cell: () => null, // We handle this in DraggableRow
  },
  {
    id: "moderator",
    accessorKey: "moderator.name",
    accessorFn: (row) => {
      return row.moderator.name;
    },
    header: "Moderator",
    cell: ({ row }) => {
      return <BottleInventoryTableCellViewer item={row.original} />;
    },
    enableHiding: false,
    filterFn: (row, columnId, value) => {
      const searchValue = value?.toLowerCase() || "";
      const cellValue = row.getValue(columnId)?.toString().toLowerCase() || "";
      return cellValue.includes(searchValue);
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="w-full">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {format(row.original.bottleUsage.createdAt, "PPPP")}
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
          startOfDay(row.original.bottleUsage.createdAt) ||
        row.original.bottleUsage.done ? (
          <>
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />{" "}
            Done
          </>
        ) : (
          <>
            <IconLoader /> In Process
          </>
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "revenue",
    header: () => (
      <div className={"w-full, text-center text-emerald-500"}>Revenue</div>
    ),
    cell: ({ row }) => (
      <div className="text-right text-emerald-500">
        {row.original.bottleUsage.revenue}
      </div>
    ),
  },
  {
    accessorKey: "expense",
    header: () => (
      <div className={"w-full, text-center text-rose-500"}>Expense</div>
    ),
    cell: ({ row }) => (
      <div className="text-right text-rose-500">
        {row.original.bottleUsage.expense}
      </div>
    ),
  },
  {
    accessorKey: "filled_bottles",
    header: () => <div className="w-full text-center">Filled</div>,
    cell: ({ row }) => (
      <div className="w-full text-right">
        {row.original.bottleUsage.filled_bottles}
      </div>
    ),
  },
  {
    accessorKey: "refilled_bottles",
    header: () => <div className="w-full text-center">Refilled</div>,
    cell: ({ row }) => (
      <div className="w-full text-right">
        {row.original.bottleUsage.refilled_bottles}
      </div>
    ),
  },
  {
    accessorKey: "sales",
    header: () => <div className="w-full text-center">Sales</div>,
    cell: ({ row }) => (
      <div className="w-full text-right">{row.original.bottleUsage.sales}</div>
    ),
  },
  {
    accessorKey: "empty_bottles",
    header: () => <div className="w-full text-center">Empty</div>,
    cell: ({ row }) => (
      <div className="w-full text-right">
        {row.original.bottleUsage.empty_bottles}
      </div>
    ),
  },
  {
    accessorKey: "remaining_bottles",
    header: () => <div className="w-full text-center">Remaining</div>,
    cell: ({ row }) => (
      <div className="w-full text-right">
        {row.original.bottleUsage.remaining_bottles}
      </div>
    ),
  },
  {
    accessorKey: "returned_bottles",
    header: () => <div className="w-full text-center">Returned</div>,
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger className="w-full flex justify-end">
          <div className="w-full text-right">
            {row.original.bottleUsage.returned_bottles}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="grid grid-cols-5">
            <p className="col-span-4">Empty Returned:</p>
            <p className="text-right">{`{ ${row.original.bottleUsage.empty_returned} }`}</p>
            <p className="col-span-4">Remaining Returned:</p>
            <p className="text-right">{`{ ${row.original.bottleUsage.remaining_returned} }`}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    accessorKey: "damaged_bottles",
    header: () => <div className="w-full text-center">Damaged</div>,
    cell: ({ row }) => (
      <div className="w-full text-right">
        {row.original.bottleUsage.damaged_bottles}
      </div>
    ),
  },
  {
    accessorKey: "caps_taken",
    header: () => (
      <div className="w-full text-center">
        Caps <span className="text-gray-400">(taken)</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="w-full text-right">{row.original.bottleUsage.caps}</div>
    ),
  },
  {
    accessorKey: "caps_used",
    header: () => (
      <div className="w-full text-center">
        Caps <span className="text-gray-400">(used)</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="w-full text-right">
        {row.original.bottleUsage.refilled_bottles}
      </div>
    ),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <ActionButton row={row} isDelete={true} />,
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
    id: row.original.bottleUsage.id,
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
        <TableCell key={cell.id} className="whitespace-nowrap">
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

export function DataTable2_1ResettedBottleUsage({
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
    () => data?.map(({ bottleUsage }) => bottleUsage.id) || [],
    [data]
  );

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.bottleUsage.id.toString(),
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
      const searchValue = value?.toLowerCase() || "";
      // Search in moderator name
      const moderatorName = row.original.moderator.name?.toLowerCase() || "";
      return moderatorName.includes(searchValue);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id && data) {
      const oldIndex = data.findIndex(
        (item) => item.bottleUsage.id === active.id
      );
      const newIndex = data.findIndex(
        (item) => item.bottleUsage.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        setData(arrayMove(data, oldIndex, newIndex));
      }
    }
  }

  return (
    <div className={""}>
      <div className="w-full flex items-center justify-between gap-4 px-4 pb-4 lg:px-6">
        <div className="flex items-center">
          <Input
            placeholder="Search names..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
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
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
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
                .map((column) => {
                  return (
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
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border w-full">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table className="w-full table-auto">
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="whitespace-nowrap"
                      >
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
                    <DraggableRow key={row.original.bottleUsage.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow className={"min-w-max"}>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {data === undefined ? (
                      <div className="flex items-center justify-center gap-2">
                        <IconLoader className="animate-spin size-4" />
                        Loading...
                      </div>
                    ) : (
                      "No results."
                    )}
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

// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ];

// const chartConfig = {
//   desktop: {
//     label: "Desktop",
//     color: "var(--primary)",
//   },
//   mobile: {
//     label: "Mobile",
//     color: "var(--primary)",
//   },
// } satisfies ChartConfig;
