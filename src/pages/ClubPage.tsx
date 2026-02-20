import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const clubData: Record<string, { description: string; events: { title: string; date: string; location: string }[] }> = {
  "FOSS Club": {
    description: "The Free and Open Source Software Club promotes open-source culture, organizes hackathons, coding workshops, and contributes to real-world projects.",
    events: [
      { title: "Hackathon 2026", date: "2026-03-15", location: "Lab 301" },
      { title: "Git Workshop", date: "2026-04-02", location: "Lab 201" },
    ],
  },
  "Robotics Club": {
    description: "Build, innovate, compete. The Robotics Club brings together makers and engineers to design robots, participate in national competitions, and explore automation.",
    events: [
      { title: "Robo Wars", date: "2026-03-20", location: "Ground Floor" },
      { title: "Arduino Bootcamp", date: "2026-04-10", location: "Electronics Lab" },
    ],
  },
  "IEEE": {
    description: "The IEEE Student Branch connects students with cutting-edge technology through tech talks, paper presentations, and industry interactions.",
    events: [
      { title: "Tech Talk: AI", date: "2026-02-20", location: "Seminar Hall" },
      { title: "Paper Presentation", date: "2026-03-28", location: "Conference Room" },
    ],
  },
  "Orenda": {
    description: "Orenda is the entrepreneurship and management club that nurtures startup ideas through pitch competitions, business workshops, and mentorship programs.",
    events: [
      { title: "Startup Pitch", date: "2026-03-25", location: "Conference Room" },
    ],
  },
  "Navaras": {
    description: "Navaras celebrates the nine emotions through performing arts — dance, drama, music, and fine arts. It's the heartbeat of cultural expression on campus.",
    events: [
      { title: "Dance Battle", date: "2026-02-20", location: "Auditorium" },
      { title: "Music Night", date: "2026-04-05", location: "Open Air Theatre" },
    ],
  },
};

const ClubPage = () => {
  const { clubName } = useParams<{ clubName: string }>();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(clubName || "");
  const club = clubData[decoded];

  if (!club) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Club not found</h1>
          <Button onClick={() => navigate("/student")} variant="outline">Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary py-6 px-6">
        <div className="container mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/student")} className="text-primary-foreground/60 hover:text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">{decoded}</h1>
            <p className="text-primary-foreground/50 text-sm">Club Page</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 shadow-card mb-8"
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-3">About</h2>
          <p className="text-muted-foreground leading-relaxed">{club.description}</p>
        </motion.div>

        <h2 className="font-display text-xl font-bold text-foreground mb-4">Events</h2>
        <div className="space-y-4">
          {club.events.map((event, i) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-5 shadow-card flex items-center justify-between"
            >
              <div>
                <h3 className="font-display font-semibold text-foreground">{event.title}</h3>
                <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => toast.success("Registered for " + event.title)}
              >
                Register
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClubPage;
