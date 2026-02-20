import { Link, useLocation } from "react-router-dom";
import { Calendar, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLanding = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isLanding ? "bg-primary/80 backdrop-blur-md" : "bg-primary shadow-md"}`}>
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-secondary" />
          <span className="font-display text-xl font-bold text-primary-foreground">
            CampusHub
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium">
            Home
          </Link>
          <Link to="/login" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium">
            Login
          </Link>
          <Link to="/login">
            <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shadow-amber">
              <LogIn className="h-4 w-4 mr-1" />
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-primary-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-primary border-t border-border/20 px-6 py-4 space-y-3">
          <Link to="/" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/login" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm" onClick={() => setMobileOpen(false)}>Login</Link>
          <Link to="/login" onClick={() => setMobileOpen(false)}>
            <Button size="sm" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
