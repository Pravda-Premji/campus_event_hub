import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, LogOut, Plus, Trash2, Edit3, Clock, MapPin, LayoutDashboard, Megaphone, User, Camera, Star, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where
} from "firebase/firestore";
import { addDoc, getDoc} from "firebase/firestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";
interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  posterURL?: string;
  eventType: "free" | "paid";
  requireScreenshot?: boolean;
}

const AdminHome = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  const [poster, setPoster] = useState<File | null>(null);
  const [eventType, setEventType] = useState<"free" | "paid">("free");
  const [requireScreenshot, setRequireScreenshot] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<{ id: string; studentName?: string; branch?: string; year?: string; phone?: string; screenshotURL?: string; [key: string]: unknown }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [clubId, setClubId] = useState("");
  const [clubProfile, setClubProfile] = useState({
  name: "",
  intro: "",
  flagshipEvent: "",
});

const [announcementTitle, setAnnouncementTitle] = useState("");
const [announcementMessage, setAnnouncementMessage] = useState("");
const [announcementExpiryDate, setAnnouncementExpiryDate] = useState("");

const [execom, setExecom] = useState<{ id: string; name?: string; role?: string; imageURL?: string; clubId?: string; [key: string]: unknown }[]>([]);
const [member, setMember] = useState({ name: "", role: "" });
const [memberImage, setMemberImage] = useState<File | null>(null);
const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
const [galleryImages, setGalleryImages] = useState<string[]>([]);
const [activeTab, setActiveTab] = useState("overview");

  // ✅ FETCH EVENTS
 useEffect(() => {
  const fetchData = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email) return;

      // ✅ STEP 1: GET CLUB
      const clubQuery = query(
        collection(db, "clubs"),
        where("adminEmail", "==", user.email)
      );

      const clubSnap = await getDocs(clubQuery);

      if (clubSnap.empty) {
        console.log("No club found");
        return;
      }

      const clubDoc = clubSnap.docs[0];
      const clubId = clubDoc.id;

      console.log("Club ID:", clubId); // 🔥 DEBUG

      setClubId(clubId);

      const clubData = clubDoc.data();

      setClubProfile({
        name: clubData.name || "",
        intro: clubData.intro || "",
        flagshipEvent: clubData.flagshipEvent || "",
      });
      setGalleryImages(clubData.gallery || []);

      // ✅ STEP 2: FETCH EXECOM
      const execomSnap = await getDocs(
        query(collection(db, "execomMembers"), where("clubId", "==", clubId))
      );

      console.log("Execom:", execomSnap.docs.length); // DEBUG

      setExecom(
        execomSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );

      // ✅ STEP 3: FETCH EVENTS
      const eventsSnap = await getDocs(
        query(collection(db, "events"), where("clubId", "==", clubId))
      );

      console.log("Events:", eventsSnap.docs.length); // DEBUG

      setEvents(
        eventsSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as EventItem),
        }))
      );

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  fetchData();
}, []);

  // ✅ LOAD REGISTRATIONS
  const loadRegistrations = async (eventId: string) => {
    const q = query(collection(db, "registrations"), where("eventId", "==", eventId));
    const snap = await getDocs(q);
    setRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // ✅ RESET
  const resetForm = () => {
    setForm({ title: "", description: "", date: "", time: "", location: "" });
    setPoster(null);
    setEditingId(null);
    setShowForm(false);
  };

  // ✅ CREATE / UPDATE EVENT
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.date) {
      toast.error("Fill required fields");
      return;
    }

    let posterURL = "";

    if (poster) {
      const formData = new FormData();
      formData.append("file", poster);
      formData.append("upload_preset", "campus_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      posterURL = data.secure_url;
    }

    const eventData = {
      ...form,
      posterURL,
      clubId: clubId,
      eventType,
      requireScreenshot,
    };

    if (editingId) {
      await updateDoc(doc(db, "events", editingId), eventData);
      toast.success("Event updated");
    } else {
      const docRef = doc(collection(db, "events"));
      await setDoc(docRef, eventData);
      setEvents(prev => [...prev, { ...eventData, id: docRef.id }]);
      toast.success("Event created");
    }

    resetForm();
  };

  // ✅ DELETE EVENT
  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, "events", id));
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || ""
    });
    setEventType(event.eventType || "free");
    setRequireScreenshot(event.requireScreenshot || false);
    setShowForm(true);
    
    // Smooth scroll to the top so the form is instantly visible to the user
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
const handleSaveClubProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user?.email) return;

    const q = query(
      collection(db, "clubs"),
      where("adminEmail", "==", user.email)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, clubProfile);
    } else {
      await addDoc(collection(db, "clubs"), {
        ...clubProfile,
        adminEmail: user.email,
      });
    }

    toast.success("Club profile saved");
  } catch (err) {
    console.error(err);
    toast.error("Error saving profile");
  }
};

const handlePostAnnouncement = async () => {
  if (!announcementTitle || !announcementMessage || !announcementExpiryDate) {
    toast.error("Please fill in title, message, and expiry date");
    return;
  }
  try {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "announcements"), {
      title: announcementTitle,
      message: announcementMessage,
      clubId: clubId,
      createdBy: user.uid,
      createdAt: new Date(),
      expiryDate: announcementExpiryDate,
      readBy: []
    });

    toast.success("Announcement posted successfully");
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setAnnouncementExpiryDate("");
  } catch (err) {
    console.error(err);
    toast.error("Failed to post announcement");
  }
};

const handleAddExecom = async () => {
  if (!member.name || !member.role) {
    toast.error("Fill all fields");
    return;
  }

  try {
    let imageURL = "";

    if (memberImage) {
      const formData = new FormData();
      formData.append("file", memberImage);
      formData.append("upload_preset", "campus_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      imageURL = data.secure_url;
    }

    const docRef = doc(collection(db, "execomMembers"));

    const newMember = {
      name: member.name,
      role: member.role,
      imageURL,
      clubId: clubId,
    };

    await setDoc(docRef, newMember);

    setExecom(prev => [...prev, { id: docRef.id, ...newMember }]);
    setMember({ name: "", role: "" });
    setMemberImage(null);

    toast.success("Member added");
  } catch (err) {
    console.error(err);
  }
};
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const handleUploadGallery = async () => {
  if (!galleryFiles.length) {
    toast.error("Select images first");
    return;
  }

  try {
    const urls: string[] = [];

    for (const file of galleryFiles) {
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
      urls.push(data.secure_url);
    }

    // 🔥 SAVE TO CURRENT CLUB ONLY
    await updateDoc(doc(db, "clubs", clubId), {
      gallery: arrayUnion(...urls),
    });

    setGalleryImages(prev => [...prev, ...urls]);

    toast.success("Gallery updated!");
    setGalleryFiles([]);

  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
  }
};

const handleDeleteGalleryImage = async (url: string) => {
  try {
    const parts = url.split('/');
    const publicId = parts[parts.length - 1].split('.')[0];
    
    await fetch(`https://api.cloudinary.com/v1_1/drnrkdzfa/delete_by_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId })
    });

    await updateDoc(doc(db, "clubs", clubId), {
      gallery: arrayRemove(url)
    });

    setGalleryImages(prev => prev.filter(img => img !== url));
    toast.success("Image deleted");
  } catch (error) {
    console.error(error);
    toast.error("Failed to delete image");
  }
};
const handleDeleteMember = async (id: string) => {
  await deleteDoc(doc(db, "execomMembers", id));
  setExecom(prev => prev.filter(m => m.id !== id));
};

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayString = `${yyyy}-${mm}-${dd}`;

  const upcomingEvents = events.filter(e => !e.date || e.date >= todayString);
  const pastEvents = events.filter(e => e.date && e.date < todayString);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">A</div>
            <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Admin Portal</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "events", icon: Calendar, label: "Events" },
            { id: "announcements", icon: Megaphone, label: "Announcements" },
            { id: "club", icon: Settings, label: "Club Profile" },
            { id: "gallery", icon: Camera, label: "Gallery" },
            { id: "team", icon: User, label: "Execom Team" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={async () => {
              await signOut(auth);
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-bold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth overflow-x-hidden">
        
        {/* Abstract Background Orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 w-full">
          
          {/* MOBILE HEADER */}
          <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">A</div>
              <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Admin Portal</span>
            </div>
            <button onClick={() => {signOut(auth); navigate("/login")}} className="p-2 text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <LogOut className="w-5 h-5 text-rose-500" />
            </button>
          </div>
          
          {/* MOBILE TABS */}
          <div className="md:hidden flex overflow-x-auto gap-2 pb-4 mb-6 hide-scrollbar">
            {["overview", "events", "announcements", "club", "gallery", "team"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-colors border ${
                  activeTab === tab 
                    ? "bg-indigo-600 text-white border-indigo-600" 
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col gap-2 mb-8">
                 <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Welcome back, Admin!</h1>
                 <p className="text-slate-500 dark:text-slate-400 font-medium">Here's what's happening in your club today.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                     <Calendar className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Events</p>
                     <p className="text-3xl font-black text-slate-800 dark:text-white">{events.length}</p>
                   </div>
                 </div>
                 
                 <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                     <User className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Execom Members</p>
                     <p className="text-3xl font-black text-slate-800 dark:text-white">{execom.length}</p>
                   </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hidden lg:flex">
                   <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                     <Star className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Club Profile</p>
                     <p className="text-lg font-black text-slate-800 dark:text-white truncate max-w-[150px]">{clubProfile.name || "Setup Required"}</p>
                   </div>
                 </div>
              </div>

              <div className="mt-8">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-indigo-500" />
                   Upcoming Events
                 </h2>

                 {upcomingEvents.length === 0 ? (
                   <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                     <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                     <p className="text-slate-500 dark:text-slate-400 font-medium">No upcoming events. Go to the Events tab to create one.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {upcomingEvents.slice(0, 4).map(event => (
                       <div key={event.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6 group hover:shadow-md transition-shadow">
                          {event.posterURL ? (
                             <img src={event.posterURL} className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-2xl shrink-0" />
                          ) : (
                             <div className="w-full sm:w-28 h-40 sm:h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
                               <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                             </div>
                          )}
                          <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{event.title}</h3>
                            <div className="space-y-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                               <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> {event.date} | {event.time}</p>
                               <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500" /> {event.location}</p>
                            </div>
                            <div className="mt-4 pb-1">
                               <button onClick={() => {setActiveTab("events"); handleEditEvent(event)}} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">Manage Event</button>
                            </div>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* 2. MANAGE EVENTS */}
          {activeTab === "events" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-2xl font-black text-slate-800 dark:text-white">Manage Events</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Create, edit, or delete club events.</p>
                 </div>
                 {!showForm && (
                   <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-sm transition-colors">
                     <Plus className="w-5 h-5" /> New Event
                   </button>
                 )}
               </div>

               {/* EVENT FORM */}
               {showForm && (
                 <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-800 p-8 mb-10 overflow-hidden relative">
                   <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                   
                   <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <Edit3 className="w-5 h-5 text-indigo-500" />
                       {editingId ? "Edit Event" : "Create New Event"}
                     </h3>
                     <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg transition-colors">Cancel</button>
                   </div>
                   
                   <form onSubmit={handleSubmitEvent} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 md:col-span-2">
                           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Title</label>
                           <Input placeholder="E.g. Annual Tech Symposium" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium" />
                        </div>
                        
                        <div className="space-y-4 md:col-span-2">
                           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                           <Textarea placeholder="Describe the event details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 min-h-[120px] font-medium" />
                        </div>

                        <div className="space-y-4">
                           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</label>
                           <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium" />
                        </div>

                        <div className="space-y-4">
                           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</label>
                           <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium" />
                        </div>

                        <div className="space-y-4 md:col-span-2">
                           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location / Venue</label>
                           <Input placeholder="E.g. Main Auditorium" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium" />
                        </div>

                        <div className="space-y-4 md:col-span-2">
                           <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Poster Banner</label>
                           <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative">
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => setPoster(e.target.files?.[0] || null)} />
                              <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Click to upload poster image</p>
                              {poster && <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-2 text-xs">{poster.name}</p>}
                           </div>
                        </div>

                        {/* EVENT TYPE RADIO */}
                        <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2">
                           <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Registration Type</p>
                           <div className="flex gap-8">
                             <label className="flex items-center gap-3 cursor-pointer">
                               <input type="radio" checked={eventType === "free"} onChange={() => setEventType("free")} className="w-5 h-5 text-indigo-600" />
                               <span className="font-bold text-slate-800 dark:text-white">Free Event</span>
                             </label>
                             <label className="flex items-center gap-3 cursor-pointer">
                               <input type="radio" checked={eventType === "paid"} onChange={() => setEventType("paid")} className="w-5 h-5 text-indigo-600" />
                               <span className="font-bold text-slate-800 dark:text-white">Paid Event</span>
                             </label>
                           </div>

                           {eventType === "paid" && (
                             <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                               <label className="flex items-center gap-3 cursor-pointer">
                                 <input
                                   type="checkbox"
                                   checked={requireScreenshot}
                                   onChange={() => setRequireScreenshot(!requireScreenshot)}
                                   className="w-5 h-5 rounded text-indigo-600"
                                 />
                                 <span className="font-semibold text-slate-700 dark:text-slate-300">Require Payment Screenshot Proof from Students</span>
                               </label>
                             </div>
                           )}
                        </div>

                      </div>
                      
                      <div className="flex justify-end pt-4">
                         <Button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-6 rounded-xl text-lg shadow-lg">
                           {editingId ? "Save Changes" : "Publish Event"}
                         </Button>
                      </div>
                   </form>
                 </div>
               )}

               {/* EVENTS LIST */}
               {!showForm && (
                 <div className="space-y-10">
                   {/* UPCOMING */}
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Active & Upcoming</h3>
                     <div className="grid grid-cols-1 gap-4">
                       {upcomingEvents.map(event => (
                         <div key={event.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {event.posterURL && (
                              <img src={event.posterURL} className="w-full md:w-48 h-48 md:h-32 object-cover rounded-xl shrink-0" />
                            )}
                            <div className="flex-1 w-full">
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{event.title}</h3>
                              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">{event.date} • {event.time} • {event.location}</p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => navigate(`/admin/registrations/${event.id}`)}
                                  className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                   View Registrations
                                </button>
                                <button onClick={() => handleEditEvent(event)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1">
                                  <Edit3 className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ml-auto">
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* PAST EVENTS */}
                   {pastEvents.length > 0 && (
                     <div>
                       <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Past Events</h3>
                       <div className="grid grid-cols-1 gap-4 opacity-75 grayscale-[30%]">
                         {pastEvents.map(event => (
                           <div key={event.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center">
                              {event.posterURL && (
                                <img src={event.posterURL} className="w-32 h-20 object-cover rounded-lg shrink-0" />
                              )}
                              <div className="flex-1 w-full">
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{event.title}</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{event.date} • {event.location}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate(`/admin/registrations/${event.id}`)}
                                  className="border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                   Registrations
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/registrations/${event.id}`)}
                                  className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                   Certificates
                                </button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="text-slate-400 hover:text-rose-500 p-2">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}

          {/* 3. ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
               <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Global Announcements</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Broadcast messages to all students on the platform.</p>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-bl-full pointer-events-none" />
                 
                 <div className="space-y-6 relative z-10">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Announcement Title</label>
                      <Input placeholder="E.g. Valid ID Card Required" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium" />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Message Content</label>
                      <Textarea placeholder="Please ensure you carry..." value={announcementMessage} onChange={e => setAnnouncementMessage(e.target.value)} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 min-h-[120px] font-medium" />
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiry Date (When to hide this)</label>
                      <Input type="date" value={announcementExpiryDate} onChange={e => setAnnouncementExpiryDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium w-full md:w-1/2" />
                   </div>

                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                     <Button onClick={handlePostAnnouncement} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 px-8 rounded-xl w-full md:w-auto shadow-lg shadow-rose-500/20">
                       <Megaphone className="w-5 h-5 mr-2" /> Post Announcement
                     </Button>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* 4. CLUB PROFILE SETTINGS */}
          {activeTab === "club" && (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
               <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Club Profile Settings</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Information displayed on the public Club Showcase page.</p>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Official Club Name</label>
                    <Input placeholder="Tech Alliance" value={clubProfile.name} onChange={e => setClubProfile({ ...clubProfile, name: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium text-lg" />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Introduction / Bio</label>
                    <Textarea placeholder="We are a community of developers..." value={clubProfile.intro} onChange={e => setClubProfile({ ...clubProfile, intro: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 min-h-[150px] font-medium" />
                 </div>

                 <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-8">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flagship Event Name</label>
                    <Input placeholder="HackSprint 2026" value={clubProfile.flagshipEvent} onChange={e => setClubProfile({ ...clubProfile, flagshipEvent: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-12 font-medium" />
                 </div>

                 <Button onClick={handleSaveClubProfile} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold py-6 px-8 rounded-xl w-full md:w-auto">
                   Save Club Details
                 </Button>
               </div>
            </div>
          )}

          {/* 5. GALLERY */}
          {activeTab === "gallery" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Club Photo Gallery</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Upload memories and event photos to display on your club page.</p>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                 <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative mb-6">
                    <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => setGalleryFiles(Array.from(e.target.files || []))} />
                    <Camera className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">Drag & Drop or Click to Select</p>
                    {galleryFiles.length > 0 && <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-2">{galleryFiles.length} files selected</p>}
                 </div>

                 <div className="flex justify-end">
                   <Button onClick={handleUploadGallery} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-5 rounded-xl shadow-lg shadow-emerald-500/20">
                     Upload Photos
                   </Button>
                 </div>
               </div>

               {galleryImages.length > 0 && (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {galleryImages.map((url, i) => (
                     <div key={i} className="relative group rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 aspect-square">
                       <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button onClick={() => handleDeleteGalleryImage(url)} className="bg-rose-500 text-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg">
                           <Trash2 className="w-5 h-5" />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* 6. EXECOM TEAM */}
          {activeTab === "team" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h2 className="text-2xl font-black text-slate-800 dark:text-white">Execom Team</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Manage core team members and coordinators.</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* ADD FORM */}
                 <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 h-max">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Add Member</h3>
                    <div className="space-y-4">
                      <Input placeholder="Full Name" value={member.name} onChange={e => setMember({ ...member, name: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-medium" />
                      <Input placeholder="Role (e.g. President)" value={member.role} onChange={e => setMember({ ...member, role: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-medium" />
                      
                      <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setMemberImage(e.target.files?.[0] || null)} />
                        {memberImage ? <span className="text-xs font-bold text-indigo-500">{memberImage.name}</span> : <span className="text-xs font-semibold text-slate-500">Select Photo (Optional)</span>}
                      </div>

                      <Button onClick={handleAddExecom} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-5 rounded-xl">Add Member</Button>
                    </div>
                 </div>

                 {/* MEMBERS LIST */}
                 <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {execom.length === 0 ? (
                     <div className="col-span-1 sm:col-span-2 py-10 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <User className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No members added yet.</p>
                     </div>
                   ) : (
                     execom.map(m => (
                       <div key={m.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group">
                          {m.imageURL ? (
                            <img src={m.imageURL} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 font-bold text-xl border-2 border-indigo-50 dark:border-indigo-800/50">
                               {m.name?.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 dark:text-white leading-tight">{m.name}</p>
                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{m.role}</p>
                          </div>
                          <button onClick={() => handleDeleteMember(m.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                     ))
                   )}
                 </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminHome;