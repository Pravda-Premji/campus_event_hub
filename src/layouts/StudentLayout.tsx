import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const StudentLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-background">
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;