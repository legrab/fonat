import { Temporal } from '@js-temporal/polyfill';
import {
  courseSchema,
  enrollmentSchema,
  learnerGroupSchema,
  learnerProfileV2Schema,
  teachingLocationSchema,
  recurringTimetableEntrySchema,
  type Course,
  type Enrollment,
  type LearnerGroup,
  type LearnerProfileV2,
  type RecurringTimetableEntry,
  type TeachingLocation
} from '@fonat/contracts';
import { err, ok, type Result } from '@fonat/contracts';
import type { Clock } from '../../clock.js';
import type { FonatRepository } from '../../repository/index.js';

export const collections = {
  learners: 'learnerProfiles',
  groups: 'learnerGroups',
  enrollments: 'enrollments',
  courses: 'courses',
  locations: 'teachingLocations',
  timetable: 'timetableEntries'
} as const;

export class OrganizationService {
  constructor(
    private readonly repository: FonatRepository,
    private readonly clock: Clock
  ) {}

  async create<T extends { id: string }>(collection: string, value: T): Promise<Result<T>> {
    if (await this.repository.getRecord(collection, value.id))
      return err({ code: 'conflict', message: `Már létezik: ${value.id}` });
    await this.repository.insertRecord(collection, value);
    return ok(value);
  }

  createLearner(value: unknown) {
    return this.create(collections.learners, learnerProfileV2Schema.parse(value));
  }
  createGroup(value: unknown) {
    return this.create(collections.groups, learnerGroupSchema.parse(value));
  }
  createEnrollment(value: unknown) {
    return this.create(collections.enrollments, enrollmentSchema.parse(value));
  }
  createCourse(value: unknown) {
    return this.create(collections.courses, courseSchema.parse(value));
  }
  createLocation(value: unknown) {
    return this.create(collections.locations, teachingLocationSchema.parse(value));
  }
  createTimetableEntry(value: unknown) {
    return this.create(collections.timetable, recurringTimetableEntrySchema.parse(value));
  }

  listLearners() {
    return this.repository.listRecords<LearnerProfileV2>(collections.learners, {
      limit: 200,
      sortField: 'nickname',
      sortDirection: 'asc'
    });
  }
  listGroups() {
    return this.repository.listRecords<LearnerGroup>(collections.groups, {
      limit: 200,
      sortField: 'name',
      sortDirection: 'asc'
    });
  }
  listEnrollments() {
    return this.repository.listRecords<Enrollment>(collections.enrollments, {
      limit: 500,
      sortField: 'startDate',
      sortDirection: 'desc'
    });
  }
  listCourses() {
    return this.repository.listRecords<Course>(collections.courses, {
      limit: 200,
      sortField: 'name',
      sortDirection: 'asc'
    });
  }
  listLocations() {
    return this.repository.listRecords<TeachingLocation>(collections.locations, {
      limit: 200,
      sortField: 'name',
      sortDirection: 'asc'
    });
  }
  listTimetableEntries() {
    return this.repository.listRecords<RecurringTimetableEntry>(collections.timetable, {
      limit: 500,
      sortField: 'weekday',
      sortDirection: 'asc'
    });
  }

  async update<T extends { id: string; version: number }>(
    collection: string,
    value: T,
    expectedVersion: number
  ): Promise<Result<T>> {
    const current = await this.repository.getRecord<T>(collection, value.id);
    if (!current) return err({ code: 'not_found', message: 'A rekord nem található.' });
    const stored = { ...value, version: expectedVersion + 1 };
    if (!(await this.repository.compareAndSwapRecord(collection, stored, expectedVersion)))
      return err({ code: 'conflict', message: 'A rekord időközben megváltozott.', details: { current } });
    return ok(stored);
  }

  async courseRoster(courseId: string) {
    const course = await this.repository.getRecord<Course>(collections.courses, courseId);
    if (!course) return err({ code: 'not_found', message: 'A kurzus nem található.' });
    const [learners, enrollments] = await Promise.all([this.listLearners(), this.listEnrollments()]);
    const groupIds = new Set(course.learnerGroupIds);
    const learnerIds = new Set(
      enrollments.items
        .filter((entry) => entry.status === 'active' && groupIds.has(entry.learnerGroupId))
        .map((entry) => entry.learnerId)
    );
    for (const id of course.includeLearnerIds) learnerIds.add(id);
    for (const id of course.excludeLearnerIds) learnerIds.delete(id);
    return ok(learners.items.filter((learner) => learnerIds.has(learner.id)));
  }

  async weeklyView(anchorDate?: string) {
    const [courses, groups, locations, entries] = await Promise.all([
      this.listCourses(),
      this.listGroups(),
      this.listLocations(),
      this.listTimetableEntries()
    ]);
    const anchor = anchorDate ? Temporal.PlainDate.from(anchorDate) : this.clock.today('Europe/Budapest');
    const monday = anchor.subtract({ days: anchor.dayOfWeek - 1 });
    const courseMap = new Map(courses.items.map((value) => [value.id, value]));
    const locationMap = new Map(locations.items.map((value) => [value.id, value]));
    const groupMap = new Map(groups.items.map((value) => [value.id, value]));
    const items = entries.items
      .map((entry) => {
        const date = monday.add({ days: entry.weekday - 1 });
        if (Temporal.PlainDate.compare(date, entry.effectiveFrom) < 0) return null;
        if (entry.effectiveTo && Temporal.PlainDate.compare(date, entry.effectiveTo) > 0) return null;
        const course = courseMap.get(entry.courseId);
        if (!course) return null;
        const start = Temporal.PlainDateTime.from(`${date.toString()}T${entry.startTime}`).toZonedDateTime(
          entry.timezone
        );
        const end = start.add({ minutes: entry.durationMinutes });
        const location = locationMap.get(entry.locationId ?? course.defaultLocationId ?? '');
        return {
          id: entry.id,
          date: date.toString(),
          start: start.toString(),
          end: end.toString(),
          localStart: entry.startTime,
          courseId: course.id,
          courseName: course.name,
          learnerGroups: course.learnerGroupIds.map((id) => groupMap.get(id)?.shortCode ?? id),
          locationId: location?.id,
          locationName: location?.name ?? 'Nincs megadva',
          overlap: false
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((a, b) => a.start.localeCompare(b.start));
    for (let index = 0; index < items.length; index++) {
      const current = items[index]!;
      current.overlap = items.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.date === current.date &&
          other.start < current.end &&
          other.end > current.start
      );
    }
    return ok({ weekStart: monday.toString(), items });
  }
}
