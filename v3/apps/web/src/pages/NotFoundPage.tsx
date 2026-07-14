import { Link } from "react-router-dom";
export function NotFoundPage() {
  return (
    <div className="center-card">
      <span className="eyebrow">404</span>
      <h1>Ez a szál megszakadt.</h1>
      <p>Az útvonal nem található, de a munkatérből nem záródtál ki.</p>
      <Link className="button" to="/">
        Vissza a Today oldalra
      </Link>
    </div>
  );
}
