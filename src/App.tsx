import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import StudentHome from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
import EventDetails from "./pages/EventDetails";
import ClubPage from "./pages/ClubPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "sonner";
import AdminRegistrations from "./pages/AdminRegistrations";
import SuperAdminPage from "./pages/SuperAdminPage";
import NotFound from "./pages/NotFound";
import HelpButton from "./components/HelpButton";
import ThemeToggle from "./components/ThemeToggle";

function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* 🔐 STUDENT ROUTES */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowed={["student"]}>
              <StudentHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/event/:eventId"
          element={
            <ProtectedRoute allowed={["student"]}>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/club/:clubId"
          element={
            <ProtectedRoute allowed={["student"]}>
              <ClubPage />
            </ProtectedRoute>
          }
        />

        {/* 🔐 ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowed={["admin", "club_admin"]}>
              <AdminHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/registrations/:eventId"
          element={
            <ProtectedRoute allowed={["admin", "club_admin"]}>
              <AdminRegistrations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredRole="superAdmin">
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Global Overlays */}
      <ThemeToggle />
      <HelpButton />
      <Toaster position="top-center" richColors duration={5000} />
    </>
  );
}

export default App;