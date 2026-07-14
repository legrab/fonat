# Extensions and contracts

Capability modules are trusted TypeScript packages discovered at build time. A module may register node types, relation types, validators, analyzers, grading handlers, renderers, settings, and seed packages.

Content packages are untrusted data. They use a versioned folder/ZIP contract and cannot execute code.

## Required package files

```text
package.json
nodes.json
relations.json
README.md
AUTHORING.md
content/        # optional Markdown
assets/         # optional and deployment-limited
```

Validate through `@fonat/content-contracts` and `@fonat/content-cli`. The importer, repository template, and CI use the same validation core.

## Adding a module

1. Create a concentrated package under `modules/`.
2. Export a manifest and typed contracts.
3. Add conformance tests.
4. Register it in the composition root.
5. Document the capability state and deployment restrictions.
6. Add one real reference fixture before generalizing.
