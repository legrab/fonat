# Implementation deviations

The following reductions preserve the golden workflow while avoiding fragile one-shot complexity.

1. **Markdown editor fallback:** The repository ships a Markdown textarea with live KaTeX preview rather than Milkdown Crepe. The editor boundary is isolated, so Milkdown can replace it after a dedicated round-trip spike. No custom rich-text engine was created.
2. **Seed implementation:** The full reference workspace is generated from typed seed code. A package CLI and template are included, but the full demo is not duplicated as thousands of lines of static package JSON.
3. **Import transactions:** Packages validate completely and apply at package granularity. MongoDB writes are ordered but not wrapped in a multi-document transaction, keeping Atlas Free compatibility and implementation simplicity.
4. **Drag and drop:** Lesson ordering has accessible move controls. Pointer-based drag and drop is deferred so it cannot become a prerequisite for the core workflow.
5. **Server-generated PDF:** Browser print and Save as PDF are complete. Local Chromium PDF generation is left as a foundation.
6. **Offline Presentation Mode:** Loaded slides and local timers continue, but queued state reconciliation is deferred.
7. **Guest claims:** Claim codes are generated and persisted in the live session. A full conflict-resolution UI is deferred.
8. **Cloud assets:** The hosted MVP uses tiny bundled SVGs and external links. Cloud object storage is deferred.

9. **Password hashing:** The implementation uses Node's built-in `scrypt` with per-password salts instead of a native Argon2 dependency. This avoids native-binary deployment friction while retaining a memory-hard password derivation function.
