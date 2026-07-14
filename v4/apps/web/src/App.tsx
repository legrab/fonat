import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { Shell } from "./components/Shell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginPage } from "./pages/LoginPage";
import { TodayPage } from "./pages/TodayPage";
import { TimetablePage } from "./pages/TimetablePage";
import { EntityListPage } from "./pages/EntityListPage";
import { ExerciseEditorPage } from "./pages/ExerciseEditorPage";
import { LessonEditorPage } from "./pages/LessonEditorPage";
import { PresentationPage } from "./pages/PresentationPage";
import { ProjectedPage } from "./pages/ProjectedPage";
import { JoinPage } from "./pages/JoinPage";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { LearnerAssignmentsPage } from "./pages/LearnerAssignmentsPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { AssessmentDeliveryPage } from "./pages/AssessmentDeliveryPage";
import { InsightsPage } from "./pages/InsightsPage";
import { AdminPage } from "./pages/AdminPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { GuidePage } from "./pages/GuidePage";
import { MathPlotPage } from "./pages/MathPlotPage";
import { NodeDetailPage } from "./pages/NodeDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
function Protected() {
  const location = useLocation();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<any>("/api/auth/me"),
    retry: false,
  });
  if (me.isLoading) return <div className="app-loading">Fonat betöltése…</div>;
  if (me.error)
    return <Navigate to="/login" state={{ from: location }} replace />;
  return <Shell />;
}
export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/project/:sessionId" element={<ProjectedPage />} />
        <Route
          path="/learner/assignments"
          element={<LearnerAssignmentsPage />}
        />
        <Route
          path="/learner/assessment/:id"
          element={<AssessmentDeliveryPage />}
        />
        <Route path="/presentation/:lessonId" element={<PresentationPage />} />
        <Route element={<Protected />}>
          <Route index element={<TodayPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="library" element={<EntityListPage route="nodes" />} />
          <Route path="library/:id" element={<NodeDetailPage />} />
          <Route path="exercises/new" element={<ExerciseEditorPage />} />
          <Route path="exercises/:id" element={<ExerciseEditorPage />} />
          <Route path="lessons" element={<EntityListPage route="lessons" />} />
          <Route path="lessons/new" element={<LessonEditorPage />} />
          <Route path="lessons/:id" element={<LessonEditorPage />} />
          <Route path="courses" element={<EntityListPage route="courses" />} />
          <Route
            path="groups"
            element={<EntityListPage route="learner-groups" />}
          />
          <Route
            path="learners"
            element={<EntityListPage route="learners" />}
          />
          <Route
            path="locations"
            element={<EntityListPage route="locations" />}
          />
          <Route
            path="annual-plans"
            element={<EntityListPage route="annual-plans" />}
          />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="math-plot" element={<MathPlotPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
