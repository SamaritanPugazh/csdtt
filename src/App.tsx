import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StudentProvider } from "@/hooks/useStudent";
import Dashboard from "./pages/Dashboard";
import StudentEntry from "./pages/StudentEntry";
import AdminAuth from "./pages/AdminAuth";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import CourseDetails from "./pages/CourseDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StudentProvider>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/entry" element={<StudentEntry />} />
              <Route path="/admin-login" element={<AdminAuth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/course/:courseCode" element={<CourseDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StudentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
