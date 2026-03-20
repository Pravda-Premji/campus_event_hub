import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, LogOut, Plus, Trash2, Edit3, Link as LinkIcon, Clock, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";


   import { addDoc, query, where} from "firebase/firestore"; // add at top

// Type definitions
interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  registrationLink: string;
  posterURL?: string;
}

interface ExecomMember {
  id: string;
  name: string;
  role: string;
  imageURL?: string;
}

interface ClubProfile {
  name: string;
  intro: string;
  flagshipEvent: string;
}

const AdminHome = () => {
  const navigate = useNavigate();

  const [clubProfile, setClubProfile] = useState<ClubProfile>({
    name: "",
    intro: "",
    flagshipEvent: "",
  });
  const [execom, setExecom] = useState<ExecomMember[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  const [member, setMember] = useState({ name: "", role: "" });
  const [memberImage, setMemberImage] = useState<File | null>(null);

  const [poster, setPoster] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    registrationLink: "",
  });
  
  // --- FETCH ALL DATA ---
  useEffect(() => {
  const fetchData = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email) return;

      // 🔥 FIXED: FETCH CLUB FROM "clubs" COLLECTION
      const q = query(
        collection(db, "clubs"),
        where("adminEmail", "==", user.email)
      );

      const clubSnap = await getDocs(q);

      if (!clubSnap.empty) {
        const data = clubSnap.docs[0].data();

        setClubProfile({
          name: data.name || "",
          intro: data.intro || "",
          flagshipEvent: data.flagshipEvent || "",
        });
      }

      // ✅ KEEP THESE SAME (UNCHANGED)
      const execomSnap = await getDocs(collection(db, "execomMembers"));
      setExecom(
        execomSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ExecomMember[]
      );

      const eventsSnap = await getDocs(collection(db, "events"));
      setEvents(
        eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EventItem[]
      );

    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  fetchData();
}, []);

  // --- CLUB PROFILE SAVE ---
 const handleSaveClubProfile = async () => {
  try {
    const user = auth.currentUser;

    if (!user?.email) {
      toast.error("User not logged in");
      return;
    }

    const clubsRef = collection(db, "clubs");

    // 🔍 check if this admin already has a club
    const q = query(clubsRef, where("adminEmail", "==", user.email));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // ✅ UPDATE existing club
      const docRef = snap.docs[0].ref;

      await updateDoc(docRef, {
        name: clubProfile.name,
        intro: clubProfile.intro,
        flagshipEvent: clubProfile.flagshipEvent,
      });

    } else {
      // ✅ CREATE new club
      await addDoc(clubsRef, {
        name: clubProfile.name,
        intro: clubProfile.intro,
        flagshipEvent: clubProfile.flagshipEvent,
        adminEmail: user.email,
      });
    }

    console.log("Saved to Firestore:", clubProfile); // 🔍 DEBUG
    toast.success("Club profile saved!");

  } catch (error) {
    console.error("SAVE ERROR:", error);
    toast.error("Failed to save club profile");
  }
};

  // --- ADD EXECom MEMBER ---
  const handleAddExecom = async () => {
    if (!member.name || !member.role) {
      toast.error("Please enter name and role");
      return;
    }
    let imageURL = "";

if (memberImage) {
  try {
    const formData = new FormData();
    formData.append("file", memberImage);
    formData.append("upload_preset", "campus_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    imageURL = data.secure_url;

    console.log("Member image uploaded:", imageURL);
  } catch (err) {
    console.error("Upload failed:", err);
    toast.error("Image upload failed");
    return;
  }
}
 const newMember = {
  name: member.name,
  role: member.role,
  imageURL,
};
   
    const docRef = doc(collection(db, "execomMembers"));
    await setDoc(docRef, newMember);
    setExecom(prev => [...prev, { id: docRef.id, ...newMember }]);
    setMember({ name: "", role: "" });
    setMemberImage(null);
    toast.success("Member added!");
  };

  // --- DELETE EXECom MEMBER ---
  const handleDeleteMember = async (id: string) => {
    await deleteDoc(doc(db, "execomMembers", id));
    setExecom(prev => prev.filter(m => m.id !== id));
    toast.success("Member removed");
  };

  // --- EVENT FORM RESET ---
  const resetForm = () => {
    setForm({ title: "", description: "", date: "", time: "", location: "", registrationLink: "" });
    setPoster(null);
    setEditingId(null);
    setShowForm(false);
  };

  // --- ADD / UPDATE EVENT ---
const handleSubmitEvent = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.title || !form.date) {
    toast.error("Please fill required fields");
    return;
  }

  try {
    // 🔥 STEP 1: Get current user
    const user = auth.currentUser;

    if (!user?.email) {
      toast.error("User not logged in");
      return;
    }

    // 🔥 STEP 2: Get clubId (MOVE THIS TO TOP)
    const q = query(
      collection(db, "clubs"),
      where("adminEmail", "==", user.email)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      toast.error("Club not found");
      return;
    }

    const clubId = snap.docs[0].id;

    // 🔥 STEP 3: Upload poster (if exists)
    let posterURL = "";

    if (poster) {
  try {
    const formData = new FormData();
    formData.append("file", poster);
    formData.append("upload_preset", "campus_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
     console.log("Cloudinary response:", data);
      if (!res.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }

    posterURL = data.secure_url;
  } catch (err) {
    console.error("Upload failed:", err);
    toast.error("Image upload failed");
    return;
  }
}
    // 🔥 STEP 4: UPDATE EVENT
    if (editingId) {
      const docRef = doc(db, "events", editingId);

      await updateDoc(docRef, {
        ...form,
        posterURL,
        clubId, // ✅ now available
      });

      setEvents(prev =>
        prev.map(e =>
          e.id === editingId
            ? { ...form, posterURL, clubId, id: e.id }
            : e
        )
      );

      toast.success("Event updated!");
    }

    // 🔥 STEP 5: CREATE EVENT
    else {
      const docRef = doc(collection(db, "events"));

      const newEvent = {
        ...form,
        posterURL,
        clubId, // ✅ correct
      };

      await setDoc(docRef, newEvent);

      setEvents(prev => [...prev, { ...newEvent, id: docRef.id }]);

      toast.success("Event created!");
    }

    resetForm();

  } catch (err) {
    console.error(err);
    toast.error("Something went wrong");
  }
};
  // --- DELETE EVENT ---
  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, "events", id));
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Event deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-primary px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-secondary" />
          <span className="font-display text-lg font-bold text-primary-foreground">CampusHub</span>
          <span className="ml-2 px-2 py-0.5 rounded-md bg-secondary/20 text-secondary text-xs font-semibold">
            Admin
          </span>
        </div>

        <button
          onClick={async () => {
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login", { replace: true });
          }}
          className="flex items-center gap-2 text-primary-foreground/60 hover:text-campus-rose text-sm"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Manage Events</h1>
            <p className="text-muted-foreground text-sm">Create, edit, or remove events</p>
          </div>

          <Button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-2"
          >
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </div>

        {/* CLUB PROFILE */}
        <h2 className="text-2xl font-bold mt-10">Club Profile</h2>
        <div className="bg-card p-6 rounded-lg mt-4 space-y-4">
          <Input
            placeholder="Club Name"
            value={clubProfile.name}
            onChange={e => setClubProfile({ ...clubProfile, name: e.target.value })}
          />
          <Textarea
            placeholder="Club Introduction"
            value={clubProfile.intro}
            onChange={e => setClubProfile({ ...clubProfile, intro: e.target.value })}
          />
          <Input
            placeholder="Flagship Event Name"
            value={clubProfile.flagshipEvent}
            onChange={e => setClubProfile({ ...clubProfile, flagshipEvent: e.target.value })}
          />
          <Button onClick={handleSaveClubProfile} className="bg-orange-500 text-white px-4 py-2 rounded">
            Save Club Profile
          </Button>
        </div>

        {/* EXECom MEMBERS */}
        <h3 className="text-xl font-semibold mt-10">Execom Members</h3>
        <div className="bg-card p-6 rounded-lg mt-4 space-y-4">
          <Input
            placeholder="Member Name"
            value={member.name}
            onChange={e => setMember({ ...member, name: e.target.value })}
          />
          <Input
            placeholder="Role (President, Secretary...)"
            value={member.role}
            onChange={e => setMember({ ...member, role: e.target.value })}
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setMemberImage(e.target.files?.[0] || null)}
          />
          <Button onClick={handleAddExecom} className="bg-orange-500 text-white px-4 py-2 rounded">
            Save Member
          </Button>
        </div>

        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {execom.map(m => (
            <div key={m.id} className="bg-card p-4 rounded-lg shadow text-center">
              {m.imageURL && <img src={m.imageURL} className="w-24 h-24 rounded-full mx-auto object-cover" />}
              <h4 className="font-semibold mt-2">{m.name}</h4>
              <p className="text-sm text-muted-foreground">{m.role}</p>
              <Button size="sm" variant="ghost" onClick={() => handleDeleteMember(m.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* EVENTS */}
        <div className="space-y-4 mt-12">
          {events.map(event => (
            <div key={event.id} className="bg-card rounded-xl p-6 shadow-card">
              {event.posterURL && (
                <img src={event.posterURL} alt={event.title} className="w-full h-48 object-cover rounded-lg mb-3" />
              )}
              <h3 className="font-bold text-lg">{event.title}</h3>
              <p className="text-muted-foreground text-sm">{event.description}</p>
              <div className="flex gap-4 text-sm mt-2 text-muted-foreground">
                <span><Calendar className="inline h-4 w-4" /> {event.date}</span>
                <span><Clock className="inline h-4 w-4" /> {event.time}</span>
                <span><MapPin className="inline h-4 w-4" /> {event.location}</span>
              </div>
              {event.registrationLink && (
                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="text-secondary text-sm mt-2 inline-block hover:underline">
                  <LinkIcon className="inline h-4 w-4" /> Registration Link
                </a>
              )}
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setForm(event); setEditingId(event.id); setShowForm(true); }}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteEvent(event.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6"
            onClick={resetForm}
          >
            <motion.div
              className="bg-card p-6 rounded-xl w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4">
                {editingId ? "Edit Event" : "Create Event"}
              </h3>

              <form onSubmit={handleSubmitEvent} className="space-y-3">
                <Input
                  placeholder="Title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
                <Input
                  type="time"
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                />
                <Input
                  placeholder="Location"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
                <Input
                  placeholder="Registration Link"
                  value={form.registrationLink}
                  onChange={e => setForm({ ...form, registrationLink: e.target.value })}
                />
                <div className="mt-3">
                  <label className="text-sm font-medium">Event Poster</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setPoster(e.target.files?.[0] || null)}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                {poster && (
                  <img
                    src={URL.createObjectURL(poster)}
                    alt="Poster Preview"
                    className="mt-3 rounded-lg w-full h-40 object-cover"
                  />
                )}
                <Button type="submit" className="w-full bg-secondary">
                  {editingId ? "Update Event" : "Create Event"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminHome;
