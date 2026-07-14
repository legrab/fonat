import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { post } from "../api";
import { Logo } from "./Logo";
const nav: Array<[string, string]> = [
  ["/", "Ma"],
  ["/timetable", "Órarend"],
  ["/library", "Könyvtár"],
  ["/exercises/new", "Új feladat"],
  ["/lessons", "Óratervek"],
  ["/assignments", "Feladatok"],
  ["/assessments", "Felmérések"],
  ["/insights", "Elemzések"],
  ["/projects", "Projektek"],
  ["/admin", "Admin"],
  ["/guide", "Útmutató"],
];
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
          {nav.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {label}
            </NavLink>
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
              {location.pathname === "/" ? "Ma" : location.pathname}
            </strong>
          </div>
          <Link
            className="button secondary"
            to="/presentation/lesson.demo-presentation"
          >
            Bemutató indítása
          </Link>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
