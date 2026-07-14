# Server agent guidance

HTTP handlers stay thin. Put deterministic educational logic in domain or services. Do not access MongoDB from feature handlers except through `FonatRepository`. Reuse the Mongo client in serverless runtimes. Validate imports completely before writes.
