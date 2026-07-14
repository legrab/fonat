import { Temporal } from '@js-temporal/polyfill';

export interface Clock {
  now(): Temporal.Instant;
  today(timezone: string): Temporal.PlainDate;
  iso(): string;
}

export class SystemClock implements Clock {
  now() {
    return Temporal.Now.instant();
  }
  today(timezone: string) {
    return Temporal.Now.zonedDateTimeISO(timezone).toPlainDate();
  }
  iso() {
    return this.now().toString();
  }
}

export class FixedClock implements Clock {
  private readonly instant: Temporal.Instant;
  constructor(value: string) {
    this.instant = Temporal.Instant.from(value);
  }
  now() {
    return this.instant;
  }
  today(timezone: string) {
    return this.instant.toZonedDateTimeISO(timezone).toPlainDate();
  }
  iso() {
    return this.instant.toString();
  }
}

export function createClock(environment: string, demoClock: string): Clock {
  return environment === 'test' || process.env.USE_DEMO_CLOCK === 'true'
    ? new FixedClock(demoClock)
    : new SystemClock();
}
