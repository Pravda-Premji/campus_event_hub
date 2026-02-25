import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  LogOut,
  Clock,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const clubs = [
  { name: "FOSS Club", emoji: "👩‍💻" },
  { name: "Robotics Club", emoji: "🤖" },
  { name: "IEEE", emoji: "🌍" },
  { name: "Orenda", emoji: "🎵" },
  { name: "Navarasa", emoji: "💃" },
];

const mockEvents = [
  { id: 1, title: "Hackathon 2026", club: "FOSS Club", date: "2026-03-15", location: "Lab 301", registered: false },
  { id: 2, title: "Robo Wars", club: "Robotics Club", date: "2026-03-20", location: "Ground Floor", registered: true },
  { id: 3, title: "Tech Talk: AI", club: "IEEE", date: "2026-02-20", location: "Seminar Hall", registered: false },
];

const StudentHome = () => {
  const navigate = useNavigate();

  // ✅ Sidebar collapse state (CORRECT POSITION)
  const [collapsed, setCollapsed] = useState(false);

  const [activeTab, setActiveTab] =
    useState<"events" | "today" | "profile">("events");

  const [events, setEvents] = useState(mockEvents);
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Student Name",
    class: "S6 CSE",
    photoURL: "",
  });

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegister = (id: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, registered: !e.registered } : e
      )
    );
    toast.success("Updated registration");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setProfileData({ ...profileData, photoURL: imageUrl });
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profile Updated Successfully!");
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* Sidebar */}
      <aside
        className={`hidden lg:flex ${
          collapsed ? "w-20" : "w-72"
        } bg-primary flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300`}
      >

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-secondary text-white p-1 rounded-full shadow-md"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-primary-foreground/10">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-secondary" />
            {!collapsed && (
              <span className="font-display text-lg font-bold text-primary-foreground">
                Tharang
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">

          <button
            onClick={() => setActiveTab("events")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
              activeTab === "events"
                ? "bg-secondary text-secondary-foreground"
                : "text-primary-foreground/60"
            }`}
          >
            <Star className="h-5 w-5" />
            {!collapsed && <span>Upcoming Events</span>}
          </button>

          <button
            onClick={() => setActiveTab("today")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
              activeTab === "today"
                ? "bg-secondary text-secondary-foreground"
                : "text-primary-foreground/60"
            }`}
          >
            <Clock className="h-5 w-5" />
            {!collapsed && <span>What's Today</span>}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
              activeTab === "profile"
                ? "bg-secondary text-secondary-foreground"
                : "text-primary-foreground/60"
            }`}
          >
            <User className="h-5 w-5" />
            {!collapsed && <span>My Profile</span>}
          </button>

          {!collapsed && (
            <div className="pt-6 pb-2 text-xs text-primary-foreground/30 uppercase px-4">
              Clubs
            </div>
          )}

          {clubs.map((club) => (
            <button
              key={club.name}
              onClick={() =>
                navigate(`/student/club/${encodeURIComponent(club.name)}`)
              }
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary-foreground/60"
            >
              <span>{club.emoji}</span>
              {!collapsed && <span>{club.name}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-primary-foreground/10">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary-foreground/60"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main
        className={`flex-1 ${
          collapsed ? "lg:ml-20" : "lg:ml-72"
        } transition-all duration-300`}
      >

        {/* Header */}
        <header className="sticky top-0 bg-background border-b border-border px-6 py-4 flex justify-between">
          <h1 className="font-display text-xl font-bold">
            {activeTab === "events" && "Upcoming Events"}
            {activeTab === "today" && "What's Happening Today"}
            {activeTab === "profile" && "My Profile"}
          </h1>

          {activeTab === "events" && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
        </header>
        {/* PROFILE TAB */}
{activeTab === "profile" && (
  <div className="max-w-2xl space-y-6">

    <div className="bg-card p-8 rounded-2xl shadow-card">

      <div className="flex items-center gap-6">

        {/* Profile Picture */}
        <div className="relative">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {profileData.photoURL ? (
              <img
                src={profileData.photoURL}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-2 text-sm"
            />
          )}
        </div>

        {/* Name & Class */}
        <div className="flex-1">
          {isEditing ? (
            <>
              <Input
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                placeholder="Full Name"
                className="mb-3"
              />

              <Input
                value={profileData.class}
                onChange={(e) =>
                  setProfileData({ ...profileData, class: e.target.value })
                }
                placeholder="Class (e.g. S6 CSE)"
              />
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold">{profileData.name}</h3>
              <p className="text-muted-foreground">{profileData.class}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

    </div>
  </div>
)}
        {/* Events */}
        <div className="p-6">
          {activeTab === "events" && (
            <div className="space-y-4 max-w-3xl">
              {filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  onClick={() =>
                    navigate(`/student/event/${event.id}`)
                  }
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl p-5 shadow-card flex justify-between gap-4 cursor-pointer"
                >
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      {event.club} • {event.date}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegister(event.id);
                    }}
                  >
                    {event.registered ? "Unregister" : "Register"}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentHome;