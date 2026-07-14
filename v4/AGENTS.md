# Agent instructions

1. Preserve working navigation, logout, presentation escape, live answer acknowledgment, and immutable submission/delivery snapshots before adding breadth.
2. Keep TypeScript end to end and retain the locked stack.
3. Prefer native platform and maintained library behavior over custom frameworks.
4. Route handlers parse/authenticate, call a workflow, and map a typed Result. Move growing workflows into their feature slice.
5. Do not place raw internal identifiers in ordinary user forms when a selector can be used.
6. Run `npm run validate`, then targeted integration and browser tests. Record every unverified item in `IMPLEMENTATION-DEVIATIONS.md`.
