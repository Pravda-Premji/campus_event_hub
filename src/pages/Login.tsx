import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ArrowLeft } from "lucide-react";
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
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verified, setVerified] = useState(false);
  // ================= AUTO VERIFY CHECK =================
  useEffect(() => {
  const checkVerification = async () => {
    const user = auth.currentUser;

    console.log("Checking verification...", user);

    if (!user) return;

    await user.reload();

    console.log("Email verified status:", user.emailVerified);

    if (user.emailVerified) {
      setVerified(true);   // 👈 this triggers green message
    }
  };

  checkVerification();
}, []);
  // ================= SIGNUP / LOGIN =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Fill all fields");
      return;
    }

    try {
      // -------- SIGNUP --------
      if (isSignUp) {
        const q = query(
          collection(db, "allowed_users"),
          where("email", "==", email)
        );
        const allowed = await getDocs(q);

        if (allowed.empty) {
          toast.error("User not allowed");
          return;
        }

        const allowedData = allowed.docs[0].data();

        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = cred.user;

        if (name) await updateProfile(user, { displayName: name });

        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          role: allowedData.role,
          club: allowedData.club || null,
          firstLoginDone: false,
        });

        await sendEmailVerification(user);
toast.success("Verification email sent. Please verify and then login.", {
  duration: 5000,   // ⏱️ 5 seconds (you can use 7000 or 10000)
});    }

      // -------- LOGIN --------
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await user.reload();
      if (!user.emailVerified) {
        toast.dismiss();   // remove previous message
        toast.error("Verify email first");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        toast.error("User data missing");
        return;
      }

      const data = snap.data();

      toast.success("Login successful!");

      if (data.role === "student") navigate("/student");
      else navigate("/admin");

    } catch (err: unknown) {
  if (err && typeof err === "object" && "code" in err) {
    const firebaseError = err as { code: string };

    switch (firebaseError.code) {
      case "auth/email-already-in-use":
        toast.error("Email already registered");
        break;
      case "auth/user-not-found":
        toast.error("User not found");
        break;
      case "auth/wrong-password":
        toast.error("Wrong password");
        break;
      case "auth/invalid-email":
        toast.error("Invalid email");
        break;
      default:
        toast.error("Something went wrong");
    }
  } else {
    toast.error("Unexpected error occurred");
  }
}
  };

  // ================= FORGOT PASSWORD =================
  const handleForgot = async () => {
    if (!forgotEmail) {
      toast.error("Enter email");
      return;
    }
    await sendPasswordResetEmail(auth, forgotEmail);
    toast.success("Reset link sent");
    setShowForgot(false);
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-primary-foreground/70"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <Calendar className="mx-auto h-8 w-8 text-secondary" />
          <h1 className="text-2xl font-bold mt-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-xl">
           {/* ✅ Verification message */}
  {verified && (
    <div className="bg-green-100 text-green-700 p-3 rounded-md text-sm mb-3 text-center">
      Email verified successfully ✅ <br />
      Please login to continue.
    </div>
  )}
          <form onSubmit={handleSubmit} className="space-y-4">

            {isSignUp && (
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button className="w-full bg-secondary">
              {isSignUp ? "Create Account" : "Login"}
            </Button>
          </form>

          {!isSignUp && (
            <button
              onClick={() => setShowForgot(true)}
              className="text-sm mt-3 w-full text-muted-foreground"
            >
              Forgot password?
            </button>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-secondary text-sm font-semibold"
            >
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForgot && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-card p-6 rounded-xl w-full max-w-sm">
              <Label>Email</Label>
              <Input
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <Button onClick={handleForgot} className="w-full mt-4 bg-secondary">
                Send Reset Link
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;