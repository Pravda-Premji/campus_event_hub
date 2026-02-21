import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { auth } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";

import { sendEmailVerification } from "firebase/auth";

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

  // ✅ SIGNUP / LOGIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);

// send verification email
await sendEmailVerification(userCred.user);

toast.success("Account created! Verification email sent. Please check your inbox.");
        if (name) {
          await updateProfile(userCred.user, {
            displayName: name,
          });
        }

        toast.success("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Logged in successfully!");
      }

      if (role === "club_admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }

    } catch (error: unknown) {

  if (error && typeof error === "object" && "code" in error) {

    const firebaseError = error as { code: string };

    switch (firebaseError.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        toast.error("Incorrect password");
        break;

      case "auth/user-not-found":
        toast.error("No account found with this email");
        break;

      case "auth/email-already-in-use":
        toast.error("Email already registered");
        break;

      case "auth/invalid-email":
        toast.error("Invalid email format");
        break;

      default:
        toast.error("Login failed. Please try again.");
    }

  } else {
    toast.error("Something went wrong");
  }
}
  };

  // ✅ FORGOT PASSWORD
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error("Enter your email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      toast.success("Password reset email sent!");
      setShowForgot(false);
      setForgotEmail("");
    } catch (error: unknown) {
if (error instanceof Error) {
  toast.error(error.message);
} else {
  toast.error("Something went wrong");
}    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground"
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
            <span className="font-display text-2xl font-bold text-primary-foreground">
              CampusHub
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-hero">
          <form onSubmit={handleSubmit} className="space-y-4">

            {isSignUp && (
              <div>
                <Label className="text-foreground text-sm">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <Label className="text-foreground text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
              />
            </div>

            <div>
              <Label className="text-foreground text-sm">Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full bg-secondary">
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {!isSignUp && (
            <button
              onClick={() => setShowForgot(true)}
              className="w-full text-sm mt-3 text-muted-foreground"
            >
              Forgot password?
            </button>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-secondary font-semibold text-sm"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Forgot Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
          >
            <div className="bg-card p-6 rounded-xl w-full max-w-sm">
              <form onSubmit={handleForgotPassword}>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <Button type="submit" className="w-full mt-4 bg-secondary">
                  Send Reset Link
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;