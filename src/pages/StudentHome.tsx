import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Award,
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
  query,
  where,
  orderBy,
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
  registeredCount?: number;
}

export interface CertificateItem {
  id: string;
  userId?: string;
  eventId?: string;
  eventName?: string;
  certificateURL?: string;
  createdAt?: { seconds: number; nanoseconds?: number };
}

export interface ClubItem {
  id: string;
  name: string;
  emoji?: string;
  [key: string]: unknown;
}

const clubs = [
  { name: "FOSS Club", emoji: "👩‍💻" },
  { name: "Robotics Club", emoji: "🤖" },
  { name: "IEEE", emoji: "🌍" },
  { name: "Orenda", emoji: "🎵" },
  { name: "Navarasa", emoji: "💃" },
];

const getDownloadUrl = (url?: string) => {
  if (!url) return "";
  if (url.includes("/upload/fl_attachment/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
};

const StudentHome = () => {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [photoURL, setPhotoURL] = useState("");
const [flippedId, setFlippedId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] =
    useState<"events" | "today" | "profile" | "certificates">("events");

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<{eventId?: string}[]>([]);
  const [previewCert, setPreviewCert] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "Student Name",
    class: "S6 CSE",
    photoURL: "",
  });
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  /* ---------------- LOAD EVENTS ---------------- */

  const loadEvents = async () => {
    const querySnapshot = await getDocs(collection(db, "events"));

    const eventList: EventItem[] = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        const regSnap = await getDocs(query(collection(db, "registrations"), where("eventId", "==", docSnap.id)));

        return {
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          date: typeof data.date === "string" ? data.date : data.date?.seconds ? new Date(data.date.seconds * 1000).toLocaleDateString() : "",
          time: typeof data.time === "string" ? data.time : "",
          location: data.location || "",
          registrationLink: data.registrationLink || "",
          club: data.club || "",
          registeredCount: regSnap.size, // ✅ REAL COUNT
        };
      })
    );

    setEvents(eventList);
  };

 useEffect(() => {
  const fetchData = async () => {
    await loadEvents(); // existing

    // 🔥 ADD THIS
    try {
      const clubSnap = await getDocs(collection(db, "clubs"));

      setClubs(
        clubSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Unknown Club",
            emoji: data.emoji || "🏆",
          } as ClubItem;
        })
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

      try {
        const certQuery = query(
          collection(db, "certificates"), 
          where("userId", "==", user.uid)
        );
        const certSnap = await getDocs(certQuery);
        setCertificates(certSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching certificates", err);
      }

      // Fetch registrations for banner matching
      try {
        const regQuery = query(
          collection(db, "registrations"),
          where("userId", "==", user.uid)
        );
        const regSnap = await getDocs(regQuery);
        setMyRegistrations(regSnap.docs.map(doc => doc.data() as {eventId?: string}));
      } catch (err) {
        console.error("Error fetching registrations", err);
      }
    };

    loadProfile();
  }, []);

  // Compute Events starting within 24 hours that user registered for
  const tomorrowEvents = events.filter(e => {
    if (!e.date || !e.time) return false;
    const evtDate = new Date(`${e.date} ${e.time}`);
    const timeDiffMs = evtDate.getTime() - Date.now();
    const hoursDiff = timeDiffMs / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 24 && myRegistrations.some(r => r.eventId === e.id);
  });

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


  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayString = `${yyyy}-${mm}-${dd}`;

  const filteredEvents = events.filter((e) => {
    const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (!e.date) return false;

    if (activeTab === "today") {
      return e.date === todayString;
    }
    if (activeTab === "events") {
      return e.date >= todayString;
    }
    return true;
  });
  /* ---------------- IMAGE UPLOAD ---------------- */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "campus_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      
      const user = auth.currentUser;
      if (user && data.secure_url) {
        await updateDoc(doc(db, "users", user.uid), {
          photoURL: data.secure_url
        });
        setPhotoURL(data.secure_url);
        setProfileData(prev => ({ ...prev, photoURL: data.secure_url }));
        toast.success("Profile image updated!", { id: toastId });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image", { id: toastId });
    }
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

          <button
            onClick={() => setActiveTab("certificates")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === "certificates"
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Award className={`h-5 w-5 ${activeTab === "certificates" ? "text-emerald-400" : ""}`} />
            {!collapsed && <span>My Certificates</span>}
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
            {activeTab === "certificates" && "My Certificates"}
          </h1>

          <div className="flex items-center gap-4">
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
            
            <div className="relative">
              <button 
                className="flex items-center justify-center shrink-0 outline-none rounded-full ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500 hover:scale-105 transition-all"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {photoURL ? (
                  <img src={photoURL} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" alt="Profile" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {name ? name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </button>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 bg-white shadow-2xl rounded-2xl p-4 min-w-[220px] border border-slate-100 z-50 origin-top-right flex flex-col gap-1"
                  >
                    <p className="font-extrabold text-slate-800 text-base">{name || "Student Name"}</p>
                    <p className="text-sm font-medium text-slate-500 truncate">{auth.currentUser?.email || "student@example.com"}</p>
                    
                    <div className="h-px bg-slate-100 my-2 w-full" />
                    
                    <button 
                      onClick={async () => {
                        await auth.signOut();
                        navigate("/");
                      }}
                      className="text-left py-2 px-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {tomorrowEvents.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 sm:mx-8 mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-lg border-2 border-orange-300 flex items-center justify-between"
          >
            <div>
              <h4 className="font-extrabold text-lg flex items-center gap-2 drop-shadow-sm">
                ⚠️ Upcoming Event Tomorrow
              </h4>
              <p className="text-sm font-semibold opacity-95">
                Don't forget! Your registered event <strong className="px-1 bg-white/20 rounded">{tomorrowEvents[0].title}</strong> is starting soon.
              </p>
            </div>
          </motion.div>
        )}

        {/* PROFILE */}

        {activeTab === "profile" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-8 max-w-4xl space-y-8"
          >

            <div className="bg-white rounded-xl shadow-md p-8 relative overflow-hidden">
              
              <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-10 relative z-10 w-full mb-8">
                <div className="flex-1 w-full space-y-1">
                  <h3 className="text-2xl font-bold text-slate-800">My Profile</h3>
                  <p className="text-slate-500 text-sm">Manage your personal details and certificates information.</p>
                </div>
                
                <div className="relative group/avatar cursor-pointer shrink-0">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-white shadow-md transition-all duration-300 ring-2 ring-slate-100">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center font-bold text-2xl tracking-widest">
                        {name ? name.charAt(0).toUpperCase() : "NA"}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <span className="text-white text-[10px] font-bold tracking-wide">Edit</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full relative z-10">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                      <div className="flex gap-3 items-center">
                        <span className="text-amber-500 text-xl">⚠️</span>
                        <p className="text-amber-800 text-sm font-bold">
                          Please enter your FULL NAME correctly. Certificates will be issued based on this name.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600">Full Name</label>
                        <Input
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shadow-sm font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600">Register Number</label>
                        <Input
                          placeholder="Register Number"
                          value={registerNumber}
                          onChange={(e) => setRegisterNumber(e.target.value)}
                          className="bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shadow-sm font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600">Phone Number</label>
                        <Input
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shadow-sm font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600">Branch</label>
                        <Input
                          placeholder="Branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shadow-sm font-medium"
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-600">Year</label>
                        <Input
                          placeholder="Year"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shadow-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                      <p className="text-lg font-semibold text-slate-800">{name || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Register Number</p>
                      <p className="text-lg font-semibold text-slate-800">{registerNumber || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="text-lg font-semibold text-slate-800">{phone || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Branch</p>
                      <p className="text-lg font-semibold text-slate-800">{branch || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Year</p>
                      <p className="text-lg font-semibold text-slate-800">{year || "Not specified"}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end border-t border-slate-100 pt-6 relative z-10">
                <Button
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                  className="rounded-full px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm hover:scale-105 shadow-md hover:shadow-lg transition-all duration-300 border-0"
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>

              {/* 🔥 MY REGISTERED EVENTS SECTION */}
              <div className="mt-12 pt-8 border-t border-slate-200 relative z-10">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-blue-500" />
                  My Registered Events
                </h3>
                
                {myRegistrations.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                    <p className="text-slate-500 font-medium">You haven't registered for any events yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myRegistrations.map((reg, idx) => {
                      const associatedEvent = events.find(e => e.id === reg.eventId);
                      if (!associatedEvent) return null;
                      return (
                        <div key={idx} className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top z-0" />
                          <div className="relative z-10">
                            <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">
                              {associatedEvent.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                <Calendar className="w-3.5 h-3.5 text-purple-500" /> 
                                {associatedEvent.date || "TBD"}
                              </span>
                              {associatedEvent.time && (
                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                  <Clock className="w-3.5 h-3.5 text-pink-500" /> 
                                  {associatedEvent.time}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  className="group bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-xl hover:shadow-2xl hover:[transform:rotateX(2deg)_rotateY(2deg)_scale(1.03)] flex flex-col justify-between gap-10 cursor-pointer transition-all duration-300 ease-out relative overflow-hidden"
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

          {activeTab === "certificates" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 perspective-1000"
            >
              {certificates.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-500 font-medium bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white/60">
                  <Award className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                  <p className="text-xl">No certificates earned yet.</p>
                  <p className="text-sm mt-2 opacity-70">Register and attend events to earn them!</p>
                </div>
              ) : (
                certificates.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-xl hover:shadow-2xl hover:-translate-y-2 flex flex-col justify-between gap-6 overflow-hidden relative group transition-all duration-300"
                  >
                    <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-400/30 transition-all duration-500" />
                    
                    <div className="space-y-4 relative z-10">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Award className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-800">
                        {cert.eventName || events.find((e) => e.id === cert.eventId)?.title || "Event Certificate"}
                      </h3>
                      <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> 
                        {cert.createdAt ? new Date(cert.createdAt.seconds * 1000).toLocaleDateString() : "Recently"}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-3 w-full relative z-10">
                      <button 
                        onClick={() => setPreviewCert(cert.certificateURL!)}
                        className="flex-1 bg-white/60 text-emerald-700 border border-emerald-200 py-3.5 rounded-full font-bold shadow-sm hover:bg-white hover:scale-105 transition-all duration-300"
                      >
                        View
                      </button>
                      <a 
                        href={getDownloadUrl(cert.certificateURL)} 
                        download
                        className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-full font-bold shadow-lg hover:shadow-[0_8px_25px_rgba(16,185,129,0.5)] hover:scale-105 transition-all duration-300"
                      >
                        Download
                      </a>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

        </div>

      </main>

      {/* CERTIFICATE PREVIEW MODAL */}
      <AnimatePresence>
        {previewCert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setPreviewCert(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col relative"
            >
              <button 
                onClick={() => setPreviewCert(null)}
                className="absolute top-[-15px] right-[-15px] bg-white border border-slate-200 shadow-md text-slate-600 hover:text-red-500 hover:scale-110 p-2 rounded-full transition-all z-10"
              >
                ✕
              </button>
              <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <iframe
                  src={previewCert}
                  className="w-full h-full"
                  title="Certificate Preview"
                />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-slate-500 font-medium">Certificate Preview</p>
                <a 
                  href={getDownloadUrl(previewCert)} 
                  download
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold shadow hover:bg-blue-700 transition-colors"
                >
                  Download HD
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentHome;