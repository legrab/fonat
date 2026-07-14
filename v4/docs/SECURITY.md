# Security

Cookies are HTTP-only, SameSite Lax, and Secure in production. Sessions are stored server-side and invalidated on logout or user disable. Authentication and live-answer endpoints are rate-limited. CORS uses an explicit allowlist. Imported package data is untrusted. Production requires MongoDB and a non-default strong session secret.

The one-shot implementation does not yet include a complete CSRF token mechanism, field-level authorization matrix, package ZIP parser, or external security review. See deviations.
