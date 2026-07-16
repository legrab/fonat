# Content authoring

Use stable identifiers, Hungarian source content, representative English translations, explicit rights metadata, accessible SVG titles/alt text, and type-specific exercise answers. Package content must remain non-executable. Run `npm run package:validate` before distribution.

## In-product teacher manual

Teacher documentation is file-backed Markdown under `apps/web/src/manual/hu/`. Article prose must stay in those source files; React owns only the manifest, navigation, search, and rendering. The renderer supports GitHub-flavored Markdown, tables, task lists, stable heading anchors, and KaTeX notation. Raw HTML and executable content are intentionally unsupported.

Register every article in `apps/web/src/manual/index.ts` with a unique slug, category, summary, search keywords, and valid related-article slugs. Link editor help directly to the relevant `/guide/:slug` article. When a teacher-facing term or workflow changes, update the terminology article, relevant how-to, contextual link, and manual tests in the same commit.

Run `npm test -- tests/unit/manual.test.ts` to validate slugs, internal links, relationships, and required terminology. Use `npm run validate` before merging.
