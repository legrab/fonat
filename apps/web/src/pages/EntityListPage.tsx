import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { api } from "../api";
const titles: Record<string, string> = {
  nodes: "Könyvtár",
  lessons: "Óratervek",
  courses: "Kurzusok",
  "learner-groups": "Tanulócsoportok",
  learners: "Tanulók",
  locations: "Helyszínek",
  "annual-plans": "Éves tervek",
  exercises: "Gyakorlófeladatok",
};
const statusLabels: Record<string, string> = {
  draft: "Piszkozat",
  published: "Közzétett",
  archived: "Archivált",
  active: "Aktív",
};

const detailPath = (route: string, id: string) => {
  if (route === "nodes") return `/library/${id}`;
  if (route === "learner-groups") return `/groups/${id}`;
  return `/${route}/${id}`;
};

const createPath = (route: string) => {
  if (route === "nodes") return "/library/new";
  if (route === "learner-groups") return "/groups/new";
  return `/${route}/new`;
};

export function EntityListPage({ route }: { route: string }) {
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: [route, search],
    queryFn: () =>
      api<any[]>(
        `/api/${route}?search=${encodeURIComponent(search)}&limit=100`,
      ),
  });
  const helper = createColumnHelper<any>();
  const columns = useMemo(
    () => [
      helper.accessor((row) => row.title || row.name || row.id, {
        id: "title",
        header: "Megnevezés",
        cell: (i) => (
          <Link to={detailPath(route, i.row.original.id)}>
            <strong>{i.getValue()}</strong>
          </Link>
        ),
      }),
      helper.accessor("lifecycle", {
        header: "Állapot",
        cell: (i) => (
          <span className="chip">
            {statusLabels[
              String(i.getValue() || i.row.original.status || "active")
            ] || String(i.getValue() || i.row.original.status || "Aktív")}
          </span>
        ),
      }),
      helper.display({
        id: "actions",
        header: "Művelet",
        cell: (i) => (
          <Link to={detailPath(route, i.row.original.id)}>Megnyitás</Link>
        ),
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
        <Link className="button" to={createPath(route)}>
          Új elem
        </Link>
      </div>
      <section className="panel">
        <div className="toolbar">
          <input
            placeholder="Keresés"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="muted">{q.data?.length || 0} találat</span>
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
