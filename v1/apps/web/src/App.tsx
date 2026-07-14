import type { SessionUser } from '@fonat/contracts';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api';
import { AppLayout } from './components/AppLayout';
import { Loading } from './components/AsyncState';
import { AdminPage } from './pages/AdminPage';
import { AssessmentPage, AssessmentsPage } from './pages/AssessmentsPage';
import { AuthPage } from './pages/AuthPage';
import { ClassesPage, ClassroomPage, LearnerPage } from './pages/ClassesPage';
import { GuidePage } from './pages/GuidePage';
import { LessonPage } from './pages/LessonPage';
import { LibraryPage } from './pages/LibraryPage';
import { LiveControlPage } from './pages/LiveControlPage';
import { NodeDetailPage } from './pages/NodeDetailPage';
import { PlanningPage } from './pages/PlanningPage';
import { PresentationPage, PresentationStartPage } from './pages/PresentationPage';
import { QuickLessonPage } from './pages/QuickLessonPage';
import { StudentJoinPage } from './pages/StudentJoinPage';
import { TodayPage } from './pages/TodayPage';

function ProtectedRoutes() {
  const location = useLocation();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<SessionUser>('/api/me'), retry: false });
  if (me.isLoading)
    return (
      <div className="student-shell">
        <Loading />
      </div>
    );
  if (me.error || !me.data) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return (
    <Routes>
      <Route element={<AppLayout user={me.data} />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/planning/quick" element={<QuickLessonPage />} />
        <Route path="/planning/lesson/:id" element={<LessonPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<NodeDetailPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/classes/:id" element={<ClassroomPage />} />
        <Route path="/classes/:id/learner/:learnerId" element={<LearnerPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/assessments/:id" element={<AssessmentPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="/presentation/start/:lessonId" element={<PresentationStartPage />} />
      <Route path="/presentation/:runId" element={<PresentationPage />} />
      <Route path="/live/:code" element={<LiveControlPage />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/student/join/:code" element={<StudentJoinPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}
