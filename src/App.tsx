import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'

// Pages — stubs will be replaced as each phase is built
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import CreateInspectionPage from '@/pages/CreateInspectionPage'
import JoinInspectionPage from '@/pages/JoinInspectionPage'
import InspectionWorkflowPage from '@/pages/InspectionWorkflowPage'
import CaptureScreen from '@/pages/CaptureScreen'
import InspectionReviewPage from '@/pages/InspectionReviewPage'
import JointVerificationPage from '@/pages/JointVerificationPage'
import BaselineLockedPage from '@/pages/BaselineLockedPage'
import ReturnInspectionStartPage from '@/pages/ReturnInspectionStartPage'
import ComparisonResultsPage from '@/pages/ComparisonResultsPage'
import ComparisonDetailPage from '@/pages/ComparisonDetailPage'
import ReportPage from '@/pages/ReportPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Inspection creation & joining */}
          <Route path="/inspections/new" element={<CreateInspectionPage />} />
          <Route path="/inspections/join" element={<JoinInspectionPage />} />

          {/* Inspection workflow */}
          <Route path="/inspections/:id" element={<InspectionWorkflowPage />} />
          <Route path="/inspections/:id/capture" element={<CaptureScreen />} />
          <Route path="/inspections/:id/review" element={<InspectionReviewPage />} />
          <Route path="/inspections/:id/verify" element={<JointVerificationPage />} />
          <Route path="/inspections/:id/locked" element={<BaselineLockedPage />} />

          {/* Return inspection */}
          <Route path="/inspections/:id/return" element={<ReturnInspectionStartPage />} />

          {/* AI comparison */}
          <Route path="/inspections/:id/compare" element={<ComparisonResultsPage />} />
          <Route path="/inspections/:id/compare/:area" element={<ComparisonDetailPage />} />

          {/* Report */}
          <Route path="/inspections/:id/report" element={<ReportPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
