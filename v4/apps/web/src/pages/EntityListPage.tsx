import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { api, post } from "../api";
const titles: Record<string, string> = {
  nodes: "Könyvtár",
  lessons: "Óratervek",
  courses: "Kurzusok",
  "learner-groups": "Tanulócsoportok",
  learners: "Tanulók",
  locations: "Helyszínek",
  "annual-plans": "Éves tervek",
};
export function EntityListPage({ route }: { route: string }) {
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: [route, search],
    queryFn: () =>
      api<any[]>(
        `/api/${route}?search=${encodeURIComponent(search)}&limit=100`,
      ),
  });
  const create = useMutation({
    mutationFn: () =>
      post(
        `/api/${route}`,
        route === "nodes"
          ? { title: newTitle, type: "concept", lifecycle: "draft" }
          : { title: newTitle, name: newTitle, status: "draft" },
      ),
    onSuccess: () => {
      setNewTitle("");
      qc.invalidateQueries({ queryKey: [route] });
    },
  });
  const helper = createColumnHelper<any>();
  const columns = useMemo(
    () => [
      helper.accessor((row) => row.title || row.name || row.id, {
        id: "title",
        header: "Megnevezés",
        cell: (i) => <strong>{i.getValue()}</strong>,
      }),
      helper.accessor("lifecycle", {
        header: "Állapot",
        cell: (i) => (
          <span className="chip">
            {i.getValue() || i.row.original.status || "aktív"}
          </span>
        ),
      }),
      helper.accessor("id", {
        header: "Azonosító",
        cell: (i) => <code>{i.getValue()}</code>,
      }),
    ],
    [route],
  );
  const table = useReactTable({
    data: q.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Szerkeszthető gyűjtemény</span>
          <h1>{titles[route] || route}</h1>
        </div>
      </div>
      <section className="panel">
        <div className="toolbar">
          <input
            placeholder="Keresés"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="inline-form">
            <input
              placeholder="Új elem neve"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <button
              disabled={!newTitle.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              Létrehozás
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              {table.getHeaderGroups().map((g) => (
                <tr key={g.id}>
                  {g.headers.map((h) => (
                    <th key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((r) => (
                <tr key={r.id}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id}>
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
