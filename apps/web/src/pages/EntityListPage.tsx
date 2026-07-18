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
import { useI18n, type TranslationKey } from "../i18n";

const titleKeys: Record<string, TranslationKey> = {
  nodes: "entity.nodes",
  lessons: "entity.lessons",
  courses: "entity.courses",
  "learner-groups": "entity.learnerGroups",
  learners: "entity.learners",
  locations: "entity.locations",
  "annual-plans": "entity.annualPlans",
  exercises: "entity.exercises",
};
const statusKeys: Record<string, TranslationKey> = {
  draft: "entity.statusDraft",
  published: "entity.statusPublished",
  archived: "entity.statusArchived",
  active: "entity.statusActive",
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
  const { t } = useI18n();
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
        header: t("entity.name"),
        cell: (i) => (
          <Link to={detailPath(route, i.row.original.id)}>
            <strong>{i.getValue()}</strong>
          </Link>
        ),
      }),
      helper.accessor("lifecycle", {
        header: t("entity.status"),
        cell: (i) => {
          const status = String(
            i.getValue() || i.row.original.status || "active",
          );
          return (
            <span className="chip">
              {statusKeys[status] ? t(statusKeys[status]) : status}
            </span>
          );
        },
      }),
      helper.display({
        id: "actions",
        header: t("entity.action"),
        cell: (i) => (
          <Link to={detailPath(route, i.row.original.id)}>
            {t("entity.open")}
          </Link>
        ),
      }),
    ],
    [route, t],
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
          <span className="eyebrow">{t("entity.eyebrow")}</span>
          <h1>{titleKeys[route] ? t(titleKeys[route]) : route}</h1>
        </div>
        <Link className="button" to={createPath(route)}>
          {t("entity.new")}
        </Link>
      </div>
      <section className="panel">
        <div className="toolbar">
          <input
            placeholder={t("entity.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="muted">
            {t("entity.results", { count: q.data?.length || 0 })}
          </span>
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
