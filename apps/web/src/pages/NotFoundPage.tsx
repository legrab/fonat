import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="center-card">
      <span className="eyebrow">404</span>
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.body")}</p>
      <Link className="button" to="/">
        {t("notFound.back")}
      </Link>
    </div>
  );
}
