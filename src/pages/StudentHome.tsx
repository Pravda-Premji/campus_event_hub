import { useState, useEffect } from "react";
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
import { toast } from "sonner";

import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  registrationLink?: string;
  club?: string;
  registered?: boolean;
}

const clubs = [
  { name: "FOSS Club", emoji: "👩‍💻" },
  { name: "Robotics Club", emoji: "🤖" },
  { name: "IEEE", emoji: "🌍" },
  { name: "Orenda", emoji: "🎵" },
  { name: "Navarasa", emoji: "💃" },
];

const StudentHome = () => {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);

  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] =
    useState<"events" | "today" | "profile">("events");

  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "Student Name",
    class: "S6 CSE",
    photoURL: "",
  });
const [clubs, setClubs] = useState<any[]>([]);
  /* ---------------- LOAD EVENTS ---------------- */

  const loadEvents = async () => {
    const querySnapshot = await getDocs(collection(db, "events"));

    const eventList: EventItem[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        title: data.title || "",
        description: data.description || "",
       date:
  typeof data.date === "string"
    ? data.date
    : data.date?.seconds
    ? new Date(data.date.seconds * 1000).toLocaleDateString()
    : "",
       time:
  typeof data.time === "string"
    ? data.time
    : "",
        location: data.location || "",
        registrationLink: data.registrationLink || "",
        club: data.club || "",
        registered: false,
      };
    });

    setEvents(eventList);
  };

 useEffect(() => {
  const fetchData = async () => {
    await loadEvents(); // existing

    // 🔥 ADD THIS
    try {
      const clubSnap = await getDocs(collection(db, "clubs"));

      setClubs(
        clubSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );
    } catch (err) {
      console.error("Error fetching clubs:", err);
    }
  };

  fetchData();
}, []);

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setName(data.name || "");
        setRegisterNumber(data.registerNumber || "");
        setPhone(data.phone || "");
        setBranch(data.branch || "");
        setYear(data.year || "");
        setPhotoURL(data.photoURL || "");
      }
    };

    loadProfile();
  }, []);

  /* ---------------- SAVE PROFILE ---------------- */

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid), {
      name,
      registerNumber,
      phone,
      branch,
      year,
      photoURL,
    });

    toast.success("Profile saved successfully");
    setIsEditing(false);
  };

  /* ---------------- REGISTER EVENT ---------------- */

  const handleRegister = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, registered: !e.registered } : e
      )
    );

    toast.success("Registration updated");
  };

  /* ---------------- FILTER EVENTS ---------------- */

 const filteredEvents = events.filter((e) =>
  (e.title || "").toLowerCase().includes(searchQuery.toLowerCase())
);
  /* ---------------- IMAGE UPLOAD ---------------- */

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setProfileData({ ...profileData, photoURL: imageUrl });
    setPhotoURL(imageUrl);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background flex">

      {/* SIDEBAR */}

      <aside
        className={`hidden lg:flex ${
          collapsed ? "w-20" : "w-72"
        } bg-primary flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300`}
      >

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-secondary text-white p-1 rounded-full shadow-md"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

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
             navigate(`/student/club/${club.id}`)
              }
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary-foreground/60"
            >
              <span>{club.emoji}</span>
              {!collapsed && <span>{club.name}</span>}
            </button>
          ))}
        </nav>

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

      {/* MAIN */}

      <main
        className={`flex-1 ${
          collapsed ? "lg:ml-20" : "lg:ml-72"
        } transition-all duration-300`}
      >

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

        {/* PROFILE */}

        {activeTab === "profile" && (
          <div className="p-6 max-w-2xl space-y-6">

            <div className="bg-card p-8 rounded-2xl shadow-card">

              <div className="flex items-center gap-6">

                <div className="relative">

                  <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {photoURL ? (
                      <img
                        src={photoURL}
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

                <div className="flex-1">

                  {isEditing ? (
                    <>
                      <Input
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mb-3"
                      />

                      <Input
                        placeholder="Register Number"
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value)}
                        className="mb-3"
                      />

                      <Input
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mb-3"
                      />

                      <Input
                        placeholder="Branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="mb-3"
                      />

                      <Input
                        placeholder="Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold">{name}</h3>
                      <p className="text-muted-foreground">{branch}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* EVENTS */}

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
                      {event.club||""} • {event.date||""}
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