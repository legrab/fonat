import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { post } from "../api";
import { ConnectionStatus } from "./ConnectionStatus";
import { Logo } from "./Logo";
const nav = [
  {
    label: "Napi munka",
    items: [
      ["/", "Ma"],
      ["/timetable", "Órarend"],
      ["/lessons", "Óratervek"],
      ["/assignments", "Kiosztások"],
      ["/assessments", "Felmérések"],
      ["/insights", "Elemzések"],
    ],
  },
  {
    label: "Tartalom",
    items: [
      ["/library", "Könyvtár"],
      ["/exercises", "Gyakorlófeladatok"],
      ["/annual-plans", "Éves tervek"],
      ["/projects", "Projektek"],
    ],
  },
  {
    label: "Munkatér",
    items: [
      ["/courses", "Kurzusok"],
      ["/groups", "Csoportok"],
      ["/learners", "Tanulók"],
      ["/locations", "Helyszínek"],
      ["/admin", "Admin"],
      ["/guide", "Útmutató"],
    ],
  },
] satisfies Array<{ label: string; items: Array<[string, string]> }>;

const routeLabels: Record<string, string> = Object.fromEntries(
  nav.flatMap((group) => group.items),
);
export function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logout = async () => {
    await post("/api/auth/logout", {});
    qc.clear();
    navigate("/login", { replace: true });
  };
  return (
    <div className="app-shell">
      <aside>
        <Link to="/">
          <Logo />
        </Link>
        <nav>
          {nav.map((group) => (
            <div className="nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="aside-footer">
          <Link to="/join">Tanulói csatlakozás</Link>
          <button className="ghost" onClick={logout}>
            Kilépés
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">Aktuális hely</span>
            <strong>
              {location.pathname === "/"
                ? "Ma"
                : routeLabels[
                    Object.keys(routeLabels).find(
                      (route) =>
                        route !== "/" && location.pathname.startsWith(route),
                    ) || ""
                  ] || "Szerkesztés"}
            </strong>
          </div>
          <Link
            className="button secondary"
            to="/presentation/lesson.demo-presentation"
          >
            Bemutató indítása
          </Link>
        </header>
        <ConnectionStatus />
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
