import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Course, Enrollment } from '@fonat/contracts';
import { hashToken } from '../../auth.js';
import type { FonatRepository } from '../../repository/index.js';
import { sendResult } from './http.js';

export type StudentAccessToken = {
  id: string;
  learnerId: string;
  expiresAt: string;
  createdAt: string;
};

export async function resolveStudent(
  request: FastifyRequest,
  repository: FonatRepository
): Promise<StudentAccessToken | null> {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return null;
  const record = await repository.getRecord<StudentAccessToken>('studentAccessTokens', hashToken(token));
  if (!record || record.expiresAt <= new Date().toISOString()) return null;
  return record;
}

export async function requireStudentForLearner(
  request: FastifyRequest,
  reply: FastifyReply,
  repository: FonatRepository,
  learnerId: string
) {
  if (request.user?.capabilities.includes('submissions.review')) return { learnerId, teacher: true };
  const student = await resolveStudent(request, repository);
  if (!student || student.learnerId !== learnerId) {
    void sendResult(reply, {
      ok: false,
      error: {
        code: 'permission_denied',
        message: 'Érvénytelen vagy lejárt tanulói hozzáférés.'
      }
    });
    return null;
  }
  return { learnerId, teacher: false };
}

export async function learnerCanAccessCourse(
  repository: FonatRepository,
  learnerId: string,
  courseId: string
) {
  const course = await repository.getRecord<Course>('courses', courseId);
  if (!course || course.excludeLearnerIds.includes(learnerId)) return false;
  if (course.includeLearnerIds.includes(learnerId)) return true;
  const enrollments = await repository.listRecords<Enrollment>('enrollments', {
    filters: { learnerId, status: 'active' },
    limit: 100
  });
  return enrollments.items.some((entry) => course.learnerGroupIds.includes(entry.learnerGroupId));
}
