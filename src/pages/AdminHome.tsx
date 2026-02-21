import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, LogOut, Plus, Trash2, Edit3, X, Link as LinkIcon,
  Clock, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";

interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  registrationLink: string;
}

const AdminHome = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 1,
      title: "Hackathon 2026",
      description: "24-hour coding marathon with exciting prizes",
      date: "2026-03-15",
      time: "09:00",
      location: "Lab 301",
      registrationLink: "https://forms.google.com/example",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    registrationLink: "",
  });

  const resetForm = () => {
    setForm({ title: "", description: "", date: "", time: "", location: "", registrationLink: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.date) {
      toast.error("Please fill required fields");
      return;
    }

    if (editingId !== null) {
      setEvents(prev =>
        prev.map(ev => (ev.id === editingId ? { ...ev, ...form } : ev))
      );
      toast.success("Event updated!");
    } else {
      setEvents(prev => [...prev, { ...form, id: Date.now() }]);
      toast.success("Event created!");
    }

    resetForm();
  };

  const handleEdit = (event: EventItem) => {
    setForm(event);
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Event deleted");
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-primary px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-secondary" />
          <span className="font-display text-lg font-bold text-primary-foreground">
            CampusHub
          </span>
          <span className="ml-2 px-2 py-0.5 rounded-md bg-secondary/20 text-secondary text-xs font-semibold">
            Admin
          </span>
        </div>

        {/* LOGOUT BUTTON — FIXED */}
        <button
          onClick={async () => {
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login", { replace: true });   // ⭐ prevents back navigation
          }}
          className="flex items-center gap-2 text-primary-foreground/60 hover:text-campus-rose text-sm transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-4xl">

        {/* Top */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Manage Events
            </h1>
            <p className="text-muted-foreground text-sm">
              Create, edit, or remove events
            </p>
          </div>

          <Button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-2"
          >
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </div>

        {/* Event List */}
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="bg-card rounded-xl p-6 shadow-card">

              <h3 className="font-bold text-lg">{event.title}</h3>
              <p className="text-muted-foreground text-sm">{event.description}</p>

              <div className="flex gap-4 text-sm mt-2 text-muted-foreground">
                <span><Calendar className="inline h-4 w-4" /> {event.date}</span>
                <span><Clock className="inline h-4 w-4" /> {event.time}</span>
                <span><MapPin className="inline h-4 w-4" /> {event.location}</span>
              </div>

              {event.registrationLink && (
                <a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary text-sm mt-2 inline-block hover:underline"
                >
                  <LinkIcon className="inline h-4 w-4" /> Registration Link
                </a>
              )}

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(event)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(event.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
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

              <form onSubmit={handleSubmit} className="space-y-3">

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

                <Input type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />

                <Input type="time"
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