"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DemographicFindingRow } from "@/lib/types";

const columns: ColumnDef<DemographicFindingRow>[] = [
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "segment",
    header: "Segment",
  },
  {
    accessorKey: "finding",
    header: "Finding",
  },
  {
    accessorKey: "source",
    header: "Source",
  },
];

export function FindingsTable({ data }: { data: DemographicFindingRow[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rowCount = useMemo(() => table.getFilteredRowModel().rows.length, [table]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Demographic Findings Table</CardTitle>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Searchable detail view powered by TanStack Table.
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2 sm:items-end">
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search findings, segment, or source"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-0 transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
          />
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {rowCount} rows
          </span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3 py-3 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 align-top last:border-0 dark:border-slate-900"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-3 text-slate-700 dark:text-slate-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
