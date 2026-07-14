# Security Policy

Report security issues privately to the repository maintainer rather than opening a public issue.

The MVP uses server-side capability checks, HTTP-only sessions, Argon2id password hashing, strict package validation, bounded uploads, sanitized Markdown rendering, and explicit deployment secrets. Content packages are data and cannot execute code. Capability modules are trusted deployment code and require normal review and redeployment.

Do not place real student administrative identities in public issue reports, logs, or example packages.
