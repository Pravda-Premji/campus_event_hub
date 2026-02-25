import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import UpcomingEvents from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
<<<<<<< HEAD
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

=======
import EventDetails from "./pages/EventDetails";
import ClubPage from "./pages/ClubPage";
>>>>>>> e70c7e09bfa96ae8a22df0fda4c70737cf1e5e81
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

<<<<<<< HEAD
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* 🔥 Required for toast messages */}
<Toaster position="top-center" richColors duration={5000} />    </>
=======
      {/* Student Page */}
      <Route path="/student" element={<UpcomingEvents />} />
      <Route path="/student/event/:eventId" element={<EventDetails />} />

      {/* Admin Page */}
      <Route path="/admin" element={<AdminHome />} />

      <Route path="/student/club/:clubName" element={<ClubPage />} />
    </Routes>
>>>>>>> e70c7e09bfa96ae8a22df0fda4c70737cf1e5e81
  );
}

export default App;