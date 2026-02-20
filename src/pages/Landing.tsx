import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlipCard from "@/components/FlipCard";
import Navbar from "@/components/Navbar";
import campusHero from "@/assets/campus-hero.jpg";
import yagnadhruvaImg from "@/assets/yagnadhruva.jpg";
import prayaagImg from "@/assets/prayaag.jpg";
import yavanikaImg from "@/assets/yavanika.jpg";

const events = [
  {
    title: "Yagnadhruva",
    tag: "Flagship Event",
    image: yagnadhruvaImg,
    description:
      "The crown jewel of our college — Yagnadhruva is the ultimate techno-cultural extravaganza spanning 3 electrifying days. With spectacular pro-show nights featuring renowned artists, technical exhibitions, cultural showcases, and adrenaline-pumping competitions, it brings the entire campus alive. It's not just an event — it's a legacy.",
  },
  {
    title: "Prayaag",
    tag: "Technical Fest",
    image: prayaagImg,
    description:
      "Prayaag is where innovation meets competition. Our premier technical fest features hackathons, coding battles, robotics challenges, paper presentations, and workshops led by industry experts. It's the playground for tech enthusiasts to push boundaries, showcase brilliance, and build the future.",
  },
  {
    title: "Yavanika",
    tag: "Cultural Fest",
    image: yavanikaImg,
    description:
      "Yavanika ignites the spirit of competition among branches as they battle for the coveted Over-Champion title. From dance face-offs and music battles to drama, art, and literary events — every branch gives their all. It's where talents shine, rivalries spark, and memories are forged.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={campusHero} alt="Campus" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/70 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary text-sm font-medium mb-6 border border-secondary/30">
              <Sparkles className="h-4 w-4" />
              Campus Event Management
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              Where Campus
              <br />
              <span className="text-gradient-amber">Comes Alive</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Your one-stop hub for all college events. Discover, register, and never miss a moment of the action. From technical fests to cultural extravaganzas — it all starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-base px-8 shadow-amber animate-pulse-glow">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <a href="#events">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-medium text-base px-8">
                  Explore Events
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { icon: Users, label: "Students", value: "5000+" },
              { icon: Trophy, label: "Events", value: "100+" },
              { icon: Sparkles, label: "Clubs", value: "15+" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="h-6 w-6 text-secondary mx-auto mb-2" />
                <div className="font-display text-2xl font-bold text-primary-foreground">{value}</div>
                <div className="text-primary-foreground/50 text-sm">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Our Pride</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Flagship Events
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Click on any event card to discover more about what makes each one unforgettable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {events.map((event, i) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <FlipCard {...event} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-hero">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to dive in?
            </h2>
            <p className="text-primary-foreground/60 mb-8 max-w-md mx-auto">
              Sign up as a student or club admin and start exploring events today.
            </p>
            <Link to="/login">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-10 shadow-amber">
                Login / Sign Up
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-8">
        <div className="container mx-auto px-6 text-center text-primary-foreground/40 text-sm">
          © 2026 CampusHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
