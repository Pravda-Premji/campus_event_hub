import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import StudentHome from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
import EventDetails from "./pages/EventDetails";
import ClubPage from "./pages/ClubPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

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
        <Route path="/admin" element={<AdminHome />} />
      </Routes>

      {/* Toasts */}
      <Toaster position="top-center" richColors duration={5000} />
    </>
  );
}

export default App;