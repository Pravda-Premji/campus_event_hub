import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Trophy, Instagram, Facebook, Youtube, Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlipCard from "@/components/FlipCard";
import Navbar from "@/components/Navbar";
import campusHero from "@/assets/campus-hero.jpg";
import yagnadhruvaImg from "@/assets/yagnadhruva.jpg";
import prayaagImg from "@/assets/prayaag.jpg";
import yavanikaImg from "@/assets/yavanika.jpg";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

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
              LBS Institute Of Technology for Women
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
                <Button size="lg" className="bg-white text-primary hover:bg-gray-200 font-medium text-base px-8">
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
              { icon: Users, label: "Students", value: "1000+" },
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
     {/* 3D Events Showcase */}
<section className="py-24 bg-background">
  <div className="container mx-auto px-6 text-center">

    <h2 className="text-4xl font-bold mb-16">
      Explore Campus Life
    </h2>

    <Swiper
  effect="coverflow"
  centeredSlides={true}
  slidesPerView={"auto"}
  loop={true}
  speed={1200}
  grabCursor={true}
  autoplay={{
    delay: 2000,
    disableOnInteraction: false,
  }}
  coverflowEffect={{
    rotate: 0,
    stretch: 0,
    depth: 300,
    modifier: 2.5,
    slideShadows: false,
  }}
  modules={[EffectCoverflow, Autoplay]}
  className="max-w-6xl"
>

      <SwiperSlide>
        <img
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998"
          className="rounded-2xl h-[400px] w-full object-cover"
        />
      </SwiperSlide>

      <SwiperSlide>
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
          className="rounded-2xl h-[400px] w-full object-cover"
        />
      </SwiperSlide>

      <SwiperSlide>
        <img
          src="https://images.unsplash.com/photo-1508606572321-901ea443707f"
          className="rounded-2xl h-[400px] w-full object-cover"
        />
      </SwiperSlide>

    </Swiper>

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
      {/* Footer */}
<footer className="bg-[#001a3d] text-white py-12">
  <div className="container mx-auto px-6 grid md:grid-cols-3 gap-10">

    {/* College Info */}
    <div>
      <h3 className="text-xl font-bold mb-4">
        LBS Institute of Technology for Women
      </h3>

      <p>Poojappura, Thiruvananthapuram - 695012</p>

      <div className="mt-4 space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          <span>0471 2349232</span>
        </div>

        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          <span>principal@lbt.ac.in</span>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <a
            href="https://www.lbt.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400"
          >
            www.lbt.ac.in
          </a>
        </div>
      </div>
    </div>

    {/* Useful Links */}
    <div>
      <h3 className="text-xl font-bold mb-4">Useful Links</h3>
      <ul className="space-y-3 text-gray-300 text-sm">
        <li>
          <a
            href="https://www.lbt.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 transition-colors"
          >
            Official Website
          </a>
        </li>

        <li>
          <a
            href="https://www.lbt.ac.in/placement"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 transition-colors"
          >
            Placement Cell
          </a>
        </li>

        <li>
          <a
            href="https://www.lbt.ac.in/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 transition-colors"
          >
            Contact Us
          </a>
        </li>
      </ul>
    </div>

    {/* Social Media */}
    <div>
      <h3 className="text-xl font-bold mb-4">Connect With Us</h3>

      <div className="flex gap-6 text-2xl">

        <a
          href="https://www.instagram.com/lbsitw_trivandrum?igsh=MWYxa21mcm91ZmoxMQ=="
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-pink-500 transition-colors"
        >
          <Instagram />
        </a>

        <a
          href="https://www.facebook.com/lbsitwpoojappura"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-400 transition-colors"
        >
          <Facebook />
        </a>

        <a
          href="https://www.youtube.com/@lbsitwcampus"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-red-500 transition-colors"
        >
          <Youtube />
        </a>

      </div>
    </div>

  </div>

  {/* Bottom Line */}
  <div className="text-center text-gray-400 text-sm mt-10 border-t border-gray-700 pt-6">
    © 2026 LBS Institute of Technology for Women. All Rights Reserved.
  </div>
</footer>
    </div>
  );
};

export default Landing;
