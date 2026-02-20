import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar, User, Bell, LogOut, Download, Clock, ChevronRight,
  Users, Search, Star, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const clubs = [
  { name: "FOSS Club", emoji: "💻" },
  { name: "Robotics Club", emoji: "🤖" },
  { name: "IEEE", emoji: "⚡" },
  { name: "Orenda", emoji: "🎯" },
  { name: "Navaras", emoji: "🎭" },
];

const mockEvents = [
  { id: 1, title: "Hackathon 2026", club: "FOSS Club", date: "2026-03-15", location: "Lab 301", registered: false },
  { id: 2, title: "Robo Wars", club: "Robotics Club", date: "2026-03-20", location: "Ground Floor", registered: true },
  { id: 3, title: "Tech Talk: AI", club: "IEEE", date: "2026-02-20", location: "Seminar Hall", registered: false },
  { id: 4, title: "Dance Battle", club: "Navaras", date: "2026-02-20", location: "Auditorium", registered: true },
  { id: 5, title: "Startup Pitch", club: "Orenda", date: "2026-03-25", location: "Conference Room", registered: false },
];

const pastEvents = [
  { title: "Code Sprint 2025", date: "2025-12-10", certificate: "#" },
  { title: "Cultural Night", date: "2025-11-20", certificate: "#" },
];

const StudentHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"events" | "today" | "profile">("events");
  const [events, setEvents] = useState(mockEvents);
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const todayEvents = events.filter((e) => e.date === today);
  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.club.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegister = (id: number) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, registered: !e.registered } : e))
    );
    const event = events.find((e) => e.id === id);
    if (event?.registered) {
      toast.info("Unregistered from " + event.title);
    } else {
      toast.success("Registered for " + event?.title + "! You'll be notified.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-primary flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-primary-foreground/10">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-secondary" />
            <span className="font-display text-lg font-bold text-primary-foreground">CampusHub</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab("events")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "events" ? "bg-secondary text-secondary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5"}`}
          >
            <Star className="h-4 w-4" /> Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab("today")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "today" ? "bg-secondary text-secondary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5"}`}
          >
            <Clock className="h-4 w-4" /> What's Today
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "profile" ? "bg-secondary text-secondary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5"}`}
          >
            <User className="h-4 w-4" /> My Profile
          </button>

          <div className="pt-6 pb-2">
            <span className="text-primary-foreground/30 text-xs font-semibold uppercase tracking-wider px-4">Clubs</span>
          </div>
          {clubs.map((club) => (
            <button
              key={club.name}
              onClick={() => navigate(`/club/${encodeURIComponent(club.name)}`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-all"
            >
              <span>{club.emoji}</span> {club.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-foreground/10">
          <button
            onClick={() => { toast.info("Logged out"); navigate("/"); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-primary-foreground/60 hover:text-campus-rose transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {activeTab === "events" && "Upcoming Events"}
              {activeTab === "today" && "What's Happening Today"}
              {activeTab === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-campus-rose" />
            </Button>
          </div>
        </header>

        {/* Mobile tabs */}
        <div className="lg:hidden flex border-b border-border">
          {(["events", "today", "profile"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === tab ? "text-secondary border-b-2 border-secondary" : "text-muted-foreground"}`}
            >
              {tab === "events" ? "Events" : tab === "today" ? "Today" : "Profile"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Events Tab */}
          {activeTab === "events" && (
            <div className="space-y-4 max-w-3xl">
              {filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl p-5 shadow-card flex items-center justify-between gap-4 hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-foreground truncate">{event.title}</h3>
                      {event.registered && (
                        <Badge className="bg-campus-teal/10 text-campus-teal border-campus-teal/20 text-xs">Registered</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.club}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRegister(event.id)}
                    className={event.registered
                      ? "bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    }
                  >
                    {event.registered ? "Unregister" : "Register"}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Today Tab */}
          {activeTab === "today" && (
            <div className="max-w-3xl">
              {todayEvents.length === 0 ? (
                <div className="text-center py-20">
                  <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Nothing scheduled today</h3>
                  <p className="text-muted-foreground">Check back later or browse upcoming events.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayEvents.map((event) => (
                    <div key={event.id} className="bg-card rounded-xl p-5 shadow-card border-l-4 border-secondary">
                      <h3 className="font-display font-semibold text-foreground">{event.title}</h3>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.club}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-8">
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center">
                    <User className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">Student Name</h3>
                    <p className="text-muted-foreground text-sm">student@college.edu</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <div className="font-display text-2xl font-bold text-foreground">{events.filter(e => e.registered).length}</div>
                    <div className="text-muted-foreground">Registered Events</div>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <div className="font-display text-2xl font-bold text-foreground">{pastEvents.length}</div>
                    <div className="text-muted-foreground">Past Events</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Past Events & Certificates</h3>
                <div className="space-y-3">
                  {pastEvents.map((event) => (
                    <div key={event.title} className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{event.title}</h4>
                        <p className="text-muted-foreground text-sm">{event.date}</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-4 w-4" /> Certificate
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentHome;
