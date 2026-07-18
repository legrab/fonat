import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { post } from "../api";
import { useI18n, type TranslationKey } from "../i18n";
import { ConnectionStatus } from "./ConnectionStatus";
import { Logo } from "./Logo";

const nav = [
  {
    label: "shell.dailyWork",
    items: [
      ["/", "shell.today"],
      ["/timetable", "shell.timetable"],
      ["/lessons", "shell.lessons"],
      ["/assignments", "shell.assignments"],
      ["/assessments", "shell.assessments"],
      ["/insights", "shell.insights"],
    ],
  },
  {
    label: "shell.content",
    items: [
      ["/library", "shell.library"],
      ["/exercises", "shell.exercises"],
      ["/annual-plans", "shell.annualPlans"],
      ["/projects", "shell.projects"],
    ],
  },
  {
    label: "shell.workspace",
    items: [
      ["/courses", "shell.courses"],
      ["/groups", "shell.groups"],
      ["/learners", "shell.learners"],
      ["/locations", "shell.locations"],
      ["/admin", "shell.admin"],
      ["/guide", "shell.guide"],
    ],
  },
] satisfies Array<{
  label: TranslationKey;
  items: Array<[string, TranslationKey]>;
}>;

export function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useI18n();
  const routeLabels = Object.fromEntries(
    nav.flatMap((group) => group.items.map(([route, key]) => [route, t(key)])),
  );
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
              <span>{t(group.label)}</span>
              {group.items.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {t(label)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="aside-footer">
          <Link to="/join">{t("shell.studentJoin")}</Link>
          <button className="ghost" onClick={logout}>
            {t("shell.logout")}
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">{t("shell.currentLocation")}</span>
            <strong>
              {location.pathname === "/"
                ? t("shell.today")
                : routeLabels[
                    Object.keys(routeLabels).find(
                      (route) =>
                        route !== "/" && location.pathname.startsWith(route),
                    ) || ""
                  ] || t("shell.editing")}
            </strong>
          </div>
          <Link
            className="button secondary"
            to="/presentation/lesson.demo-presentation"
          >
            {t("shell.startPresentation")}
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
