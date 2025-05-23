import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useAuthContext } from './contexts/AuthContext';

import MainAppLayout from './components/layout/MainAppLayout';
import PageLoader from './components/common/PageLoader';

import SigninPage from './pages/auth/SigninPage';
import SignupPage from './pages/auth/SignupPage';

const ExplorePage = lazy(() => import('./pages/course/ExplorePage'));
const ExploreDetailPage = lazy(() => import('./pages/course/ExploreDetailPage'));
const EnrolledCoursePage = lazy(() => import('./pages/course/EnrolledCoursePage'));
const EnrolledCourseDetailPage = lazy(() => import('./pages/course/EnrolledCourseDetailPage'));
const CreatedCoursePage = lazy(() => import('./pages/course/CreatedCoursePage'));
const CreatedCourseDetailPage = lazy(() => import('./pages/course/CreatedCourseDetailPage'));
const CreateCoursePage = lazy(() => import('./pages/course/CreateCoursePage'));
const AuthorProfilePage = lazy(() => import('./pages/course/AuthorProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const ProtectedRoute = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader message="Verifying access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const { theme } = useTheme();
  const { isLoading, isAuthenticated } = useAuthContext();

  if (isLoading) {
    return <PageLoader message="Initializing..." />;
  }

  return (
    <Suspense fallback={<PageLoader message="Loading Page..." />}>
      <Routes>
        <Route
          path="/signin"
          element={isAuthenticated ? <Navigate to="/explore" replace /> : <SigninPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/explore" replace /> : <SignupPage />}
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainAppLayout>
                <Routes>
                  <Route index element={<Navigate to="/explore" replace />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/explore/:courseId" element={<ExploreDetailPage />} />
                  <Route path="/enrolled-course" element={<EnrolledCoursePage />} />
                  <Route path="/enrolled-course/:courseId" element={<EnrolledCourseDetailPage />} />
                  <Route path="/created-course" element={<CreatedCoursePage />} />
                  <Route path="/created-course/create-new-course" element={<CreateCoursePage />} />
                  <Route path="/created-course/:courseId" element={<CreatedCourseDetailPage />} />
                  <Route path="/author/:authorId" element={<AuthorProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </MainAppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;