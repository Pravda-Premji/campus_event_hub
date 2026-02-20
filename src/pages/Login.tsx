import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [role, setRole] = useState<"student" | "club_admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [selectedClub, setSelectedClub] = useState("");

  const clubs = ["FOSS Club", "Robotics Club", "IEEE", "Orenda", "Navaras"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    // Mock auth — navigate based on role
    toast.success(isSignUp ? "Account created!" : "Logged in successfully!");
    if (role === "club_admin") {
      navigate("/admin");
    } else {
      navigate("/student");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }
    toast.success("Password reset link sent to your email!");
    setShowForgot(false);
    setForgotEmail("");
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Calendar className="h-8 w-8 text-secondary" />
            <span className="font-display text-2xl font-bold text-primary-foreground">CampusHub</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-primary-foreground/50 text-sm">
            {isSignUp ? "Join the campus community" : "Sign in to continue"}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-hero">
          {/* Role toggle */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === "student" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Student
            </button>
            <button
              onClick={() => setRole("club_admin")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === "club_admin" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Club Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name" className="text-foreground text-sm">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-foreground text-sm">College Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {role === "club_admin" && isSignUp && (
              <div>
                <Label htmlFor="club" className="text-foreground text-sm">Select Club</Label>
                <select
                  id="club"
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose your club</option>
                  {clubs.map((club) => (
                    <option key={club} value={club}>{club}</option>
                  ))}
                </select>
              </div>
            )}

            <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shadow-amber">
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {!isSignUp && (
            <button
              onClick={() => setShowForgot(true)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
            >
              Forgot password?
            </button>
          )}

          <div className="mt-6 text-center">
            <span className="text-muted-foreground text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </span>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-secondary font-semibold text-sm ml-1 hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-8 w-full max-w-sm shadow-hero"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-bold text-foreground">Reset Password</h3>
                <button onClick={() => setShowForgot(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email" className="text-foreground text-sm">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@college.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                  Send Reset Link
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
