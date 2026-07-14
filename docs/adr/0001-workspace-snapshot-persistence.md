# ADR 0001: bounded workspace snapshot for one-shot delivery

Status: temporary accepted deviation.

The first implementation uses one versioned workspace snapshot behind a persistence interface. This made the critical workflows executable in one delivery and preserves optimistic concurrency. It must be replaced by collection-per-aggregate repositories before large datasets or concurrent multi-teacher use.
