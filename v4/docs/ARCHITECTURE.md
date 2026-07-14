# Architecture

The application uses one Fastify factory and three thin runtime adapters: local/Docker listener, Vercel request bridge, and Fastify injection in tests. The frontend is a Vite SPA. Shared contracts remain free of React, Fastify, MongoDB, and provider imports.

The current persistence adapter stores a versioned bounded workspace snapshot with optimistic compare-and-swap. It is deliberately isolated behind `StatePersistence`. Production scale requires the collection-per-aggregate migration described in the deviations document.

Expected failures use the `Result<T>` envelope. Lesson-run transitions, grading, live answer idempotency, and reset logic live outside React components.
