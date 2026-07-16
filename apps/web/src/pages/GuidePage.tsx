import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Markdown } from "../components/Markdown";
import { manualArticles, manualCategories } from "../manual";

export function GuidePage() {
  const { slug } = useParams();
  const [search, setSearch] = useState("");
  const article = manualArticles.find((item) => item.slug === slug);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("hu");
    if (!needle) return manualArticles;
    return manualArticles.filter((item) =>
      [item.title, item.summary, item.keywords.join(" "), item.body]
        .join(" ")
        .toLocaleLowerCase("hu")
        .includes(needle),
    );
  }, [search]);
  if (slug && !article)
    return (
      <section className="panel">
        <h1>Ez a súgóoldal nem található</h1>
        <Link to="/guide">Vissza az útmutatóhoz</Link>
      </section>
    );
  if (article) {
    const related = article.related
      .map((relatedSlug) =>
        manualArticles.find((item) => item.slug === relatedSlug),
      )
      .filter((item): item is (typeof manualArticles)[number] => Boolean(item));
    return (
      <>
        <div className="page-title manual-title">
          <div>
            <span className="eyebrow">{article.category}</span>
            <h1>{article.title}</h1>
            <p className="muted">{article.summary}</p>
          </div>
          <Link className="button secondary" to="/guide">
            Összes útmutató
          </Link>
        </div>
        <div className="manual-layout">
          <aside className="panel manual-toc">
            <strong>Útmutató</strong>
            {manualCategories.map((category) => (
              <div key={category}>
                <span>{category}</span>
                {manualArticles
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <Link
                      className={item.slug === article.slug ? "active" : ""}
                      key={item.slug}
                      to={`/guide/${item.slug}`}
                    >
                      {item.title}
                    </Link>
                  ))}
              </div>
            ))}
          </aside>
          <article className="panel manual-article">
            <Markdown>{article.body}</Markdown>
            {related.length > 0 && (
              <footer>
                <h2>Kapcsolódó útmutatók</h2>
                <div className="card-row">
                  {related.map((item) => (
                    <Link
                      className="metric-card"
                      key={item.slug}
                      to={`/guide/${item.slug}`}
                    >
                      <strong>{item.title}</strong>
                      <small>{item.summary}</small>
                    </Link>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Beépített segítség</span>
          <h1>Fonat útmutató</h1>
          <p className="muted">
            Fogalmak, lépésről lépésre útmutatók és tanári tippek.
          </p>
        </div>
      </div>
      <section className="panel manual-search">
        <label>
          Keresés az útmutatóban
          <input
            type="search"
            placeholder="például tolerancia vagy kiosztás"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <span className="muted">{filtered.length} találat</span>
      </section>
      {manualCategories.map((category) => {
        const articles = filtered.filter((item) => item.category === category);
        if (!articles.length) return null;
        return (
          <section key={category}>
            <h2>{category}</h2>
            <div className="card-row manual-cards">
              {articles.map((item) => (
                <Link
                  className="panel guide-card"
                  key={item.slug}
                  to={`/guide/${item.slug}`}
                >
                  <span className="eyebrow">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {!filtered.length && (
        <section className="panel">
          <h2>Nincs találat</h2>
          <p>Próbálj rövidebb vagy másik tanári kifejezést.</p>
        </section>
      )}
    </>
  );
}
