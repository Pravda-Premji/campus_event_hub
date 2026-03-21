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
const [flippedId, setFlippedId] = useState<string | null>(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex font-sans">

      {/* SIDEBAR */}

      <aside
        className={`hidden lg:flex ${
          collapsed ? "w-20" : "w-72"
        } bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950 flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl border-r border-white/10`}
      >

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-7 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 p-1.5 rounded-full shadow-lg transition-all z-50 hover:scale-110"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-6 h-20 flex items-center border-b border-white/10">
          <div className="flex items-center gap-3 w-full">
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-glow p-2.5 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-display text-2xl tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-purple-100">
                Tharang
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto w-full styled-scrollbar">

          <button
            onClick={() => setActiveTab("events")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "events"
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Star className={`h-5 w-5 ${activeTab === "events" ? "text-blue-400" : ""}`} />
            {!collapsed && <span>Upcoming Events</span>}
          </button>

          <button
            onClick={() => setActiveTab("today")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "today"
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Clock className={`h-5 w-5 ${activeTab === "today" ? "text-purple-400" : ""}`} />
            {!collapsed && <span>What's Today</span>}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "profile"
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <User className={`h-5 w-5 ${activeTab === "profile" ? "text-pink-400" : ""}`} />
            {!collapsed && <span>My Profile</span>}
          </button>

          {!collapsed && (
            <div className="pt-8 pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">
              Clubs
            </div>
          )}

          {clubs.map((club) => (
            <button
              key={club.name}
              onClick={() =>
             navigate(`/student/club/${club.id}`)
              }
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200 rounded-xl group"
            >
              <span className="text-base group-hover:scale-125 transition-transform duration-300 drop-shadow-md">{club.emoji}</span>
              {!collapsed && <span>{club.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-400 hover:bg-pink-500/10 hover:text-pink-400 rounded-xl transition-colors duration-200"
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
        } transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] relative z-10`}
      >

        <header className="sticky top-0 z-30 bg-white/40 backdrop-blur-xl border-b border-white/20 px-8 py-5 flex items-center justify-between shadow-sm">

          <h1 className="font-display text-3xl tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
            {activeTab === "events" && "Upcoming Events"}
            {activeTab === "today" && "What's Happening Today"}
            {activeTab === "profile" && "My Profile"}
          </h1>

          {activeTab === "events" && (
            <div className="relative hidden sm:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 w-72 rounded-full bg-white/60 backdrop-blur-md border border-white/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/50 shadow-[0_4px_15px_rgba(0,0,0,0.03)] transition-all duration-300 h-11 font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          )}
        </header>

        {/* PROFILE */}

        {activeTab === "profile" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-8 max-w-4xl space-y-8"
          >

            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/60 shadow-xl relative overflow-hidden">
              
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none blur-3xl" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-10 relative z-10">

                <div className="relative group/avatar cursor-pointer">

                  <div className="h-32 w-32 rounded-full overflow-hidden bg-white flex items-center justify-center border-4 border-white shadow-lg group-hover/avatar:shadow-2xl group-hover/avatar:scale-105 transition-all duration-300 ring-4 ring-purple-100">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-slate-300" />
                    )}
                  </div>

                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <span className="text-white text-xs font-bold tracking-wide">Update</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-5">

                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/60 border-white/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded-xl h-12 shadow-sm font-medium"
                      />

                      <Input
                        placeholder="Register Number"
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value)}
                        className="bg-white/60 border-white/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded-xl h-12 shadow-sm font-medium"
                      />

                      <Input
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-white/60 border-white/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded-xl h-12 shadow-sm font-medium"
                      />

                      <Input
                        placeholder="Branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="bg-white/60 border-white/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded-xl h-12 shadow-sm font-medium"
                      />

                      <Input
                        placeholder="Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="bg-white/60 border-white/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded-xl h-12 shadow-sm font-medium sm:col-span-2"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-4xl font-extrabold tracking-tight text-slate-800">{name || "Your Name"}</h3>
                      <p className="text-lg text-slate-500 font-semibold">{branch || "Add a branch"} {year ? `• ${year}` : ""}</p>
                      <p className="text-sm text-slate-400 font-medium mt-3 bg-white/50 inline-block px-3 py-1.5 rounded-lg border border-white/40">{registerNumber ? `Reg No: ${registerNumber}` : ""} {phone ? `• Ph: ${phone}` : ""}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 flex justify-end border-t border-white/40 pt-8 relative z-10">
                <Button
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                  className="rounded-full px-10 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-base hover:scale-105 shadow-glow hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)] hover:brightness-110 transition-all duration-300 border-0"
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>

            </div>
          </motion.div>
        )}

        {/* EVENTS */}

        <div className="p-4 sm:p-8">

          {activeTab === "events" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 perspective-1000"
            >

              {filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  onClick={() =>
                    navigate(`/student/event/${event.id}`)
                  }
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ y: -8 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                  className="group bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-xl hover:shadow-neon hover-3d flex flex-col justify-between gap-10 cursor-pointer transition-all duration-300 ease-out relative overflow-hidden"
                >
                  
                  {/* Subtle gradient inner glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  {/* Gradient top border fake highlight */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="space-y-4 relative z-10">
                    <h3 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">{event.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                      {event.club && (
                        <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                          {event.club}
                        </span>
                      )}
                      {event.date && (
                        <span className="flex items-center gap-1.5 bg-white/80 border border-white px-4 py-1.5 rounded-full text-xs shadow-sm">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" /> 
                          {event.date}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative z-10 w-full mt-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setFlippedId(flippedId === event.id ? null : event.id)}
                      className="w-full relative h-[3.25rem] perspective-1000 group/btn"
                    >
                      {/* Vibrant Glowing Pill Button */}
                      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[15px] font-bold rounded-full shadow-glow group-hover/btn:scale-105 group-hover/btn:brightness-110 group-hover/btn:shadow-[0_8px_25px_rgba(99,102,241,0.6)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${flippedId === event.id ? "opacity-0 scale-90 pointer-events-none translate-y-3" : "opacity-100 scale-100 translate-y-0"}`}>
                        Participants Registered
                        {/* Pulse effect layer */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-0 group-hover/btn:opacity-50" />
                      </div>

                      {/* Info state */}
                      <div className={`absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 text-[15px] font-bold rounded-full shadow-inner transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:scale-105 ${flippedId === event.id ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 pointer-events-none -translate-y-3"}`}>
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-600 font-black">{event.registeredCount || 0}</span> Registered
                        </span>
                      </div>
                    </button>         
                  </div>
                </motion.div>
              ))}

            </motion.div>
          )}

        </div>

      </main>

    </div>
  );
};

export default StudentHome;