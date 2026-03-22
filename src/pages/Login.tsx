import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { auth, db } from "@/firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // ================= MAIN SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Fill all fields");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      // ================= SIGN UP =================
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "allowed_users"),
          where("email", "==", email)
        );
        const allowed = await getDocs(q);

        if (allowed.empty) {
          toast.error("You are not allowed to register. Contact admin.");
          setLoading(false);
          return;
        }

        const allowedData = allowed.docs[0].data();

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        if (name) await updateProfile(user, { displayName: name });

        await setDoc(doc(db, "users", user.uid), {
          name: name || "",
          email,
          role: allowedData.role,
          club: allowedData.club || null,
        });

        await sendEmailVerification(user);

        toast.success("Account created! A verification email has been sent. Please verify before logging in.");
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
        setLoading(false);
        return;
      }

      // ================= LOGIN =================
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ✅ FIX: Reload and then read from auth.currentUser (not stale cred.user)
      await cred.user.reload();
      const user = auth.currentUser;

      if (!user) {
        toast.error("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      if (!user.emailVerified) {
        toast.error("Please verify your email before logging in. Check your inbox.");
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        toast.error("User profile not found. Contact admin.");
        setLoading(false);
        return;
      }

      const data = snap.data() as { role?: string; name?: string; club?: string };

      if (!data?.role) {
        toast.error("No role assigned to your account. Contact admin.");
        setLoading(false);
        return;
      }

      if (data.role === "student") {
        navigate("/student", { replace: true });
        return;
      }

      if (data.role === "admin" || data.role === "club_admin") {
        navigate("/admin", { replace: true });
        return;
      }

      toast.error("Unrecognized role. Contact admin.");

    } catch (err: unknown) {
  console.error("AUTH ERROR:", err);

  if (err instanceof Error) {
    console.log(err.message);
  }

  const error = err as { code?: string; message?: string };

  const code = error.code ?? "";
}finally {
      setLoading(false);
    }
  };

  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      toast.success("Password reset email sent. Check your inbox.");
      setShowForgot(false);
      setForgotEmail("");
    } catch (err: unknown) {
  const error = err as { code?: string };

  const code: string = error.code ?? "";

  if (code === "auth/user-not-found" || code === "auth/invalid-email") {
    toast.error("No account found with that email.");
  } else {
    toast.error("Failed to send reset email. Please try again.");
  }
}
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative">

      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div className="w-full max-w-md">

        <div className="text-center mb-6">
          <Calendar className="mx-auto h-8 w-8 text-white" />
          <h1 className="text-2xl font-bold text-white mt-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-xl">

          <form onSubmit={handleSubmit} className="space-y-4">

            {isSignUp && (
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary"
            >
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>

          </form>

          {!isSignUp && (
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm mt-3 w-full text-muted-foreground hover:underline"
            >
              Forgot password?
            </button>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-secondary text-sm font-semibold hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
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
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card p-6 rounded-xl w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForgot(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-secondary">
                    Send Reset Link
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;