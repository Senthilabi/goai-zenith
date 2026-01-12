import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import About from "./pages/About";
import News from "./pages/News";
import Insights from "./pages/Insights";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import EmployeeLogin from "./pages/EmployeeLogin";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminRoute } from "./components/AdminRoute";

// HRMS Imports
import HRMSLayout from "./hrms/layout/HRMSLayout";
import HRMSDashboard from "./hrms/pages/Dashboard";
import EmployeeList from "./hrms/pages/EmployeeList";
import AttendanceView from "./hrms/pages/AttendanceView";
import LeaveManager from "./hrms/pages/LeaveManager";
import Recruitment from "./hrms/pages/Recruitment";
import TaskBoard from "./hrms/pages/TaskBoard";

import OnboardingWizard from "./hrms/pages/OnboardingWizard";
import Profile from "./hrms/pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* HRMS Routes - Completely Isolated (No Navigation/Footer) */}
            <Route path="/hrms" element={
              <ProtectedRoute>
                <HRMSLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/hrms/dashboard" replace />} />
              <Route path="dashboard" element={<HRMSDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="attendance" element={<AttendanceView />} />
              <Route path="leaves" element={<LeaveManager />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="tasks" element={<TaskBoard />} />
            </Route>

            {/* Main Website Routes (With Navigation/Footer) */}
            <Route path="*" element={
              <div className="flex flex-col min-h-screen">
                <Navigation />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Onboarding Route (Public/Token based) */}
                    <Route path="/onboarding/:id" element={<OnboardingWizard />} />

                    {/* Employee Portal Routes */}
                    <Route path="/employee-login" element={<EmployeeLogin />} />
                    {/* Redirect old portal to new HRMS */}
                    <Route path="/portal" element={<Navigate to="/hrms" replace />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <Footer />
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
