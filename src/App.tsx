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
import Portal from "./pages/Portal";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                {/* HRMS Routes - Completely Isolated */}
                <Route path="/hrms" element={<HRMSLayout />}>
                  <Route index element={<Navigate to="/hrms/dashboard" replace />} />
                  <Route path="dashboard" element={<HRMSDashboard />} />
                  <Route path="employees" element={<EmployeeList />} />
                  <Route path="attendance" element={<AttendanceView />} />
                  <Route path="leaves" element={<LeaveManager />} />
                  <Route path="recruitment" element={<Recruitment />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
