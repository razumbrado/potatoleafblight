import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AboutPage } from '@/pages/AboutPage';
import { DetectionPage } from '@/pages/DetectionPage';
import { DiseasesPage } from '@/pages/DiseasesPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { ScanDetailPage } from '@/pages/ScanDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';

// Recharts is only needed on the dashboard, so it is loaded on demand.
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })));
const ModelEvaluationPage = lazy(() => import('@/pages/ModelEvaluationPage').then((module) => ({ default: module.ModelEvaluationPage })));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
      <Loader2 className="h-7 w-7 animate-spin text-accent" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<AppLayout />}>
        {/* Open to visitors */}
        <Route path="/detect" element={<DetectionPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route
          path="/model-evaluation"
          element={
            <Suspense fallback={<PageFallback />}>
              <ModelEvaluationPage />
            </Suspense>
          }
        />
        <Route path="/diseases" element={<DiseasesPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Require an account */}
        <Route element={<ProtectedRoute />}>
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<ScanDetailPage />} />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<PageFallback />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/detection" element={<Navigate to="/detect" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
