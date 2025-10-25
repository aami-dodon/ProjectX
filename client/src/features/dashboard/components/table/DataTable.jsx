import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card.jsx';
import Input from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';

const PAGE_SIZES = [10, 20, 30, 40, 50];

function paginate(array, pageIndex, pageSize) {
  const start = pageIndex * pageSize;
  return array.slice(start, start + pageSize);
}

function DataTable({ rows = [] }) {
  const [query, setQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.header, r.type, r.status, r.reviewer].some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = useMemo(() => paginate(filtered, pageIndex, pageSize), [filtered, pageIndex, pageSize]);

  const goto = (idx) => setPageIndex(Math.max(0, Math.min(idx, pageCount - 1)));

  return (
    <Card className="px-4 py-4 lg:px-6">
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter sections..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPageIndex(0);
            }}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rows-per-page" className="text-sm text-muted-foreground">
            Rows per page
          </label>
          <select
            id="rows-per-page"
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageIndex(0);
            }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Header</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Target</th>
                <th className="px-3 py-2 text-right font-medium">Limit</th>
                <th className="px-3 py-2 font-medium">Reviewer</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {page.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center text-muted-foreground">
                    No results
                  </td>
                </tr>
              ) : (
                page.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">
                      <button className="text-foreground hover:underline">{r.header}</button>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.target}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.limit}</td>
                    <td className="px-3 py-2">{r.reviewer}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="outline" size="sm">
                        Actions
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-3 flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goto(0)} disabled={pageIndex === 0}>
            « First
          </Button>
          <Button variant="outline" size="sm" onClick={() => goto(pageIndex - 1)} disabled={pageIndex === 0}>
            ‹ Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goto(pageIndex + 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            Next ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goto(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            Last »
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default DataTable;

