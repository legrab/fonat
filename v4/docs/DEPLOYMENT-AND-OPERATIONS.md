# Deployment and operations

The README is authoritative for local, Docker, Vercel, and Render values. `/api/health` reports profile, persistence, and workspace version. Production startup rejects memory persistence and the default development secret. MongoDB replica-set support is required for the intended transaction-capable profile.
