import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import UpcomingEvents from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
import EventDetails from "./pages/EventDetails";
import ClubPage from "./pages/ClubPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Student Protected */}
        {/* Student Protected */}
<Route
  path="/student"
  element={
    <ProtectedRoute allowed={["student"]}>
      <UpcomingEvents />
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
  path="/student/club/:clubName"
  element={
    <ProtectedRoute allowed={["student"]}>
      <ClubPage />
    </ProtectedRoute>
  }
/>

{/* Admin Protected */}
<Route
  path="/admin"
  element={
    <ProtectedRoute allowed={["admin", "club_admin"]}>
      <AdminHome />
    </ProtectedRoute>
  }
/>
      </Routes>

      {/* Toasts */}
      <Toaster position="top-center" richColors duration={5000} />
    </>
  );
}

export default App;