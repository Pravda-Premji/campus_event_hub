import { Link, useLocation } from "react-router-dom";
import { Calendar, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLanding = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isLanding
          ? "bg-[#1e293b]/90 backdrop-blur-md border-b border-white/5"
          : "bg-[#1e293b] shadow-md"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Calendar className="h-6 w-6 text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(249,115,22,1)] transition-all" />
          <span className="font-display text-xl font-bold text-white drop-shadow-sm">
            Tharang
          </span>
        </Link>

        {/* Desktop Login Only */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/login"
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1e293b] border-t border-white/10 px-6 py-4 space-y-3">
          <Link
            to="/login"
            className="block text-white/80 hover:text-white text-sm"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;