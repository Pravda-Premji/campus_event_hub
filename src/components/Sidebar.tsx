import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#14284b] text-white p-6">
      <h2 className="text-xl font-bold mb-8">CampusHub</h2>

      <nav className="space-y-4">
        <Link to="/student" className="block hover:text-orange-400">
          Upcoming Events
        </Link>

        <Link to="/student/today" className="block hover:text-orange-400">
          What's Today
        </Link>

        <Link to="/student/profile" className="block hover:text-orange-400">
          My Profile
        </Link>

        <div className="mt-6 text-sm text-gray-400">CLUBS</div>

        <Link to="/student/club/foss" className="block hover:text-orange-400">
          FOSS Club
        </Link>

        <Link to="/student/club/robotics" className="block hover:text-orange-400">
          Robotics Club
        </Link>

        <Link to="/student/club/ieee" className="block hover:text-orange-400">
          IEEE
        </Link>

        <Link to="/student/club/orenda" className="block hover:text-orange-400">
          Orenda
        </Link>

        <Link to="/student/club/navaras" className="block hover:text-orange-400">
          Navaras
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;