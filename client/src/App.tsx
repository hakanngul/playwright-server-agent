import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";

// Playwright Server Agent Pages
import TestPlans from "./pages/TestPlans";
import CreateTestPlan from "./pages/TestPlans/Create";
import EditTestPlan from "./pages/TestPlans/Edit";
import TestRun from "./pages/TestRun";
import Results from "./pages/Results";
import ResultDetail from "./pages/Results/Detail";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Dashboard />} />

            {/* Playwright Server Agent Pages */}
            <Route path="/test-plans" element={<TestPlans />} />
            <Route path="/test-plans/create" element={<CreateTestPlan />} />
            <Route path="/test-plans/edit/:id" element={<EditTestPlan />} />
            <Route path="/test-run" element={<TestRun />} />
            <Route path="/results" element={<Results />} />
            <Route path="/results/:id" element={<ResultDetail />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/performance/:id" element={<Performance />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
