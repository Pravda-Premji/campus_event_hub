import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, LogOut, Plus, Trash2, Edit3, X, Link as LinkIcon,
  Clock, MapPin, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
      toast.error("Please fill in required fields");
      return;
    }

    if (editingId !== null) {
      setEvents((prev) => prev.map((ev) => (ev.id === editingId ? { ...ev, ...form } : ev)));
      toast.success("Event updated!");
    } else {
      setEvents((prev) => [...prev, { ...form, id: Date.now() }]);
      toast.success("Event created!");
    }
    resetForm();
  };

  const handleEdit = (event: EventItem) => {
    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      registrationLink: event.registrationLink,
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-secondary" />
          <span className="font-display text-lg font-bold text-primary-foreground">CampusHub</span>
          <span className="ml-2 px-2 py-0.5 rounded-md bg-secondary/20 text-secondary text-xs font-semibold">Admin</span>
        </div>
        <button
          onClick={() => { toast.info("Logged out"); navigate("/"); }}
          className="flex items-center gap-2 text-primary-foreground/60 hover:text-campus-rose text-sm transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Manage Events</h1>
            <p className="text-muted-foreground text-sm">Create, edit, or remove events for your club</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shadow-amber gap-2"
          >
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </div>

        {/* Event list */}
        <div className="space-y-4">
          {events.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">No events yet</h3>
              <p className="text-muted-foreground">Create your first event to get started.</p>
            </div>
          )}
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-6 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-bold text-foreground">{event.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm mt-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                  </div>
                  {event.registrationLink && (
                    <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-secondary text-sm mt-2 hover:underline">
                      <LinkIcon className="h-3.5 w-3.5" /> Registration Link
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(event)} className="text-muted-foreground hover:text-foreground">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="text-muted-foreground hover:text-campus-rose">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-8 w-full max-w-lg shadow-hero max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-bold text-foreground">
                  {editingId ? "Edit Event" : "Create Event"}
                </h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Event Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hackathon 2026" className="mt-1" />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's the event about?" className="mt-1" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground text-sm">Date *</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-sm">Time</Label>
                    <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground text-sm">Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Seminar Hall" className="mt-1" />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Registration Link</Label>
                  <Input value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} placeholder="https://forms.google.com/..." className="mt-1" />
                </div>
                <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shadow-amber">
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
