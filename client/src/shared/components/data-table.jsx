import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Separator } from "@/shared/components/ui/separator"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { cn } from "@/shared/lib/utils"

function DraggableRow({
  row,
  renderCells,
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}>
      {renderCells(row)}
    </TableRow>
  );
}

export function DataTable({
  columns,
  data = [],
  title,
  description,
  isLoading = false,
  error,
  onRefresh,
  headerActions,
  renderHeader,
  toolbar,
  renderToolbar,
  emptyMessage = "No results found",
  skeletonRowCount = 5,
  className,
  getRowId,
  stickyHeader = false,
  enableRowSelection = false,
  enableRowReorder = false,
  onDataChange,
  enablePagination = false,
  pageSizeOptions = [10, 20, 30, 40, 50],
  initialPageSize = 10,
  renderFooter,
  selectionMessage = (table) =>
    `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`,
}) {
  const [tableData, setTableData] = React.useState(() => data ?? [])

  React.useEffect(() => {
    setTableData(data ?? [])
  }, [data])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState([])
  const [sorting, setSorting] = React.useState([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const resolvedGetRowId = React.useCallback(
    (row, index) => {
      if (typeof getRowId === "function") {
        const value = getRowId(row, index)

        if (typeof value === "number") {
          return `${value}`
        }

        if (value == null) {
          return `${index}`
        }

        return `${value}`
      }

      if (row && (typeof row.id === "string" || typeof row.id === "number")) {
        return `${row.id}`
      }

      return `${index}`
    },
    [getRowId]
  )

  const tableState = React.useMemo(
    () => ({
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
      ...(enableRowSelection ? { rowSelection } : {}),
    }),
    [
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
      enableRowSelection,
      rowSelection,
    ]
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: tableState,
    enableRowSelection,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: resolvedGetRowId,
  })

  const columnCount =
    table.getVisibleLeafColumns().length || columns?.length || 1
  const errorMessage =
    typeof error === "string" ? error : error?.message

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const handleDataChange = React.useCallback(
    (updater) => {
      setTableData((previous) => {
        const nextData =
          typeof updater === "function" ? updater(previous) : updater ?? previous

        if (nextData !== previous) {
          onDataChange?.(nextData)
        }

        return nextData
      })
    },
    [onDataChange]
  )

  const handleDragEnd = React.useCallback(
    (event) => {
      if (!enableRowReorder) {
        return
      }

      const { active, over } = event
      if (!over || active.id === over.id) {
        return
      }

      handleDataChange((current) => {
        const currentIds = current.map((row, index) => resolvedGetRowId(row, index))
        const oldIndex = currentIds.indexOf(active.id)
        const newIndex = currentIds.indexOf(over.id)

        if (oldIndex === -1 || newIndex === -1) {
          return current
        }

        return arrayMove(current, oldIndex, newIndex)
      })
    },
    [enableRowReorder, handleDataChange, resolvedGetRowId]
  )

  const refreshButton =
    typeof onRefresh === "function" ? (
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}>
        Refresh
      </Button>
    ) : null

  const headerNode =
    typeof renderHeader === "function"
      ? normalizeHeader(renderHeader({ table, isLoading }))
      : renderDefaultHeader({
          title,
          description,
          headerActions,
          refreshButton,
        })

  const toolbarNode =
    typeof renderToolbar === "function"
      ? renderToolbar({ table, isLoading })
      : toolbar
      ? <div className="px-4 lg:px-6">{toolbar}</div>
      : null

  const errorNode = errorMessage ? (
    <div className="px-4 text-sm text-destructive lg:px-6">{errorMessage}</div>
  ) : null

  const renderCells = React.useCallback(
    (row) =>
      row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(cell.column.columnDef.meta?.cellClassName)}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      )),
    []
  )

  const bodyContent = isLoading
    ? Array.from({ length: skeletonRowCount }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell colSpan={columnCount}>
            <Skeleton className="h-6 w-full" />
          </TableCell>
        </TableRow>
      ))
    : table.getRowModel().rows?.length
    ? enableRowReorder
      ? (
          <SortableContext
            items={table.getRowModel().rows.map((row) => row.id)}
            strategy={verticalListSortingStrategy}>
            {table.getRowModel().rows.map((row) => (
              <DraggableRow
                key={row.id}
                row={row}
                renderCells={renderCells}
              />
            ))}
          </SortableContext>
        )
      : table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
            {renderCells(row)}
          </TableRow>
        ))
    : (
        <TableRow>
          <TableCell
            colSpan={columnCount}
            className="text-center text-sm text-muted-foreground">
            {emptyMessage}
          </TableCell>
        </TableRow>
      )

  const tableElement = (
    <Table>
      <TableHeader className={cn(stickyHeader && "bg-muted sticky top-0 z-10")}>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              if (header.isPlaceholder) {
                return <TableHead key={header.id} colSpan={header.colSpan} />
              }

              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className={cn(header.column.columnDef.meta?.headerClassName)}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className={cn(enableRowReorder && "**:data-[slot=table-cell]:first:w-8")}>
        {bodyContent}
      </TableBody>
    </Table>
  )

  const tableContent = enableRowReorder ? (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}>
      {tableElement}
    </DndContext>
  ) : (
    tableElement
  )

  const footerNode =
    typeof renderFooter === "function"
      ? renderFooter({
          table,
          enableRowSelection,
          enablePagination,
          pageSizeOptions,
          selectionMessage,
        })
      : renderDefaultFooter({
          table,
          enableRowSelection,
          enablePagination,
          pageSizeOptions,
          selectionMessage,
        })

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {headerNode}
      {errorNode}
      {toolbarNode}
      <div className="overflow-hidden rounded-lg border">{tableContent}</div>
      {footerNode}
    </div>
  )
}

function normalizeHeader(content) {
  if (!content) {
    return null
  }

  if (React.isValidElement(content) || typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    return (
      <div className="px-4 lg:px-6">
        {content}
      </div>
    )
  }

  if (typeof content === "object") {
    const {
      leading,
      trailing,
      className: headerClassName,
      leadingClassName,
      trailingClassName,
    } = content

    if (!leading && !trailing) {
      return null
    }

    return (
      <div
        className={cn(
          "flex flex-col gap-2 px-4 lg:px-6 lg:flex-row lg:items-center lg:justify-between",
          headerClassName
        )}>
        {leading ? (
          <div className={cn("flex-1", leadingClassName)}>{leading}</div>
        ) : (
          <span className={cn("flex-1", leadingClassName)} />
        )}
        {trailing ? (
          <div
            className={cn(
              "flex flex-wrap items-center justify-end gap-2",
              trailingClassName
            )}>
            {trailing}
          </div>
        ) : null}
      </div>
    )
  }

  return null
}

function renderDefaultHeader({
  title,
  description,
  headerActions,
  refreshButton,
}) {
  if (!title && !description && !headerActions && !refreshButton) {
    return null
  }

  return normalizeHeader({
    leading: (
      <div className="space-y-1">
        {title ? (
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        ) : null}
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    ),
    trailing: (
      <>
        {headerActions}
        {refreshButton}
      </>
    ),
  })
}

function renderDefaultFooter({
  table,
  enableRowSelection,
  enablePagination,
  pageSizeOptions,
  selectionMessage,
}) {
  const selectionText =
    enableRowSelection && selectionMessage
      ? selectionMessage(table)
      : null

  if (!enablePagination) {
    if (!selectionText) return null;
    return (
      <div className="px-4 pb-4 text-sm text-muted-foreground lg:px-6">
        {selectionText}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-4 pb-4 lg:px-6">
      {selectionText ? (
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {selectionText}
        </div>
      ) : (
        <span className="hidden flex-1 lg:flex" />
      )}
      <div className="flex w-full items-center gap-4 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Go to first page</span>
            <IconChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <span className="sr-only">Go to previous page</span>
            <IconChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Go to next page</span>
            <IconChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(Math.max(table.getPageCount() - 1, 0))}
            disabled={!table.getCanNextPage()}>
            <span className="sr-only">Go to last page</span>
            <IconChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

function renderSlot(slot, args) {
  if (!slot) {
    return null
  }

  const value = typeof slot === "function" ? slot(args) : slot

  if (value == null || value === false) {
    return null
  }

  if (Array.isArray(value)) {
    return React.Children.toArray(value)
  }

  return value
}

export function DataTableRowDrawer({
  trigger,
  item,
  title,
  description,
  headerActions,
  renderView,
  renderEdit,
  renderViewFooter,
  renderEditFooter,
  viewLabel = "View",
  editLabel = "Edit",
  defaultTab,
  direction,
  mobileDirection = "bottom",
  onOpenChange,
  open,
  initialOpen = false,
  contentClassName,
  headerClassName,
  tabsWrapperClassName,
  tabsListClassName,
  viewContentClassName,
  editContentClassName,
  viewFooterClassName,
  editFooterClassName,
  ...drawerProps
}) {
  const isMobile = useIsMobile()
  const resolvedDirection = isMobile
    ? mobileDirection ?? direction ?? "bottom"
    : direction ?? "right"
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen)
  const isControlled = typeof open === "boolean"
  const openState = isControlled ? open : uncontrolledOpen

  const tabs = React.useMemo(() => {
    const config = []

    if (renderView) {
      config.push({ value: "view", label: viewLabel })
    }

    if (renderEdit) {
      config.push({ value: "edit", label: editLabel })
    }

    return config
  }, [renderEdit, renderView, editLabel, viewLabel])

  const normalizedDefaultTab = React.useMemo(() => {
    if (defaultTab) {
      return defaultTab
    }

    if (renderView) {
      return "view"
    }

    if (renderEdit) {
      return "edit"
    }

    return "view"
  }, [defaultTab, renderEdit, renderView])

  const [activeTab, setActiveTab] = React.useState(normalizedDefaultTab)

  React.useEffect(() => {
    if (!openState) {
      setActiveTab(normalizedDefaultTab)
    }
  }, [normalizedDefaultTab, openState])

  const setOpenState = React.useCallback(
    (nextOpen) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }

      if (!nextOpen) {
        setActiveTab(normalizedDefaultTab)
      }

      onOpenChange?.(nextOpen)
    },
    [isControlled, normalizedDefaultTab, onOpenChange]
  )

  const close = React.useCallback(() => {
    setOpenState(false)
  }, [setOpenState])

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      setOpenState(nextOpen)
    },
    [setOpenState]
  )

  const args = React.useMemo(
    () => ({ item, close, setTab: setActiveTab }),
    [item, close]
  )

  if (!renderView && !renderEdit) {
    return trigger ?? null
  }

  return (
    <Drawer
      open={openState}
      onOpenChange={handleOpenChange}
      direction={resolvedDirection}
      {...drawerProps}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent className={cn("flex h-full max-h-[80vh] flex-col sm:max-w-xl", contentClassName)}>
        <DrawerHeader className={cn("gap-1 border-b px-4 py-4 text-left", headerClassName)}>
          {title ? <DrawerTitle>{renderSlot(title, args)}</DrawerTitle> : null}
          {description ? (
            <DrawerDescription>{renderSlot(description, args)}</DrawerDescription>
          ) : null}
          {headerActions ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {renderSlot(headerActions, args)}
            </div>
          ) : null}
        </DrawerHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-1 flex-col">
          {tabs.length > 1 ? (
            <div className={cn("border-b px-4 pb-3 pt-3", tabsWrapperClassName)}>
              <TabsList
                className={cn(
                  "bg-muted/70 text-muted-foreground h-9 w-fit items-center justify-start",
                  tabsListClassName
                )}>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          ) : (
            <Separator />
          )}
          {tabs.map((tab) => {
            const isView = tab.value === "view"
            const content = renderSlot(isView ? renderView : renderEdit, args)
            const footer = renderSlot(
              isView ? renderViewFooter : renderEditFooter,
              args
            )

            return (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="flex flex-1 flex-col">
                <div
                  className={cn(
                    "flex-1 overflow-y-auto px-4 pb-6 text-sm",
                    isView ? viewContentClassName : editContentClassName
                  )}>
                  {content}
                </div>
                {footer ? (
                  <DrawerFooter
                    className={cn(
                      "mt-0 border-t bg-muted/40",
                      isView ? viewFooterClassName : editFooterClassName
                    )}>
                    {footer}
                  </DrawerFooter>
                ) : null}
              </TabsContent>
            )
          })}
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}
