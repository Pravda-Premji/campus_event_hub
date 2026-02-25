import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import UpcomingEvents from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
import EventDetails from "./pages/EventDetails";
import ClubPage from "./pages/ClubPage";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Student Page */}
      <Route path="/student" element={<UpcomingEvents />} />
      <Route path="/student/event/:eventId" element={<EventDetails />} />

      {/* Admin Page */}
      <Route path="/admin" element={<AdminHome />} />

      <Route path="/student/club/:clubName" element={<ClubPage />} />
    </Routes>
  );
}

export default App;