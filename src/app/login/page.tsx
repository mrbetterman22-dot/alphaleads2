"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const supabase = createClientComponentClient();

  useEffect(() => {
    setMounted(true);
    
  }, []);

  // ÚJ: State checks
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    // Check active session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    };
    checkSession();

    
  }, []);

  const isDark = theme === "dark";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  // ... (rest of methods)

  const normalizeEmail = (e: string) => e.trim().toLowerCase();

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
    const now = new Date().getTime();

    if (loginAttempts[email] && loginAttempts[email].count >= 5) {
      const lastAttempt = loginAttempts[email].timestamp;
      if (now - lastAttempt < 5 * 60 * 1000) {
        toast({
          variant: "destructive",
          title: "Too many failed login attempts",
          description: "Please try again in 5 minutes.",
        });
        return;
      } else {
        // Reset the count after 5 minutes
        delete loginAttempts[email];
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
      }
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (!loginAttempts[email]) {
        loginAttempts[email] = { count: 0, timestamp: 0 };
      }
      loginAttempts[email].count++;
      loginAttempts[email].timestamp = now;
      localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsSubmitting(false);
    } else {
      delete loginAttempts[email];
      localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
      
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      router.refresh();
      router.push("/dashboard");
    }
  };

  

  const handleSignUp = async () => {
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }
    

    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
    } else {
      
      toast({
        title: "Check your email",
        description:
          "Confirmation link sent. If you already have an account, please Sign In.",
      });
    }
    setIsSubmitting(false);
  };

  // --- RENDER ---

  // NOTE: If mounted is false, we return null (handled below).
  if (!mounted) return null;

  // SCENARIO 1: User is ALREADY LOGGED IN
  if (currentUser) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center px-4",
          isDark ? "bg-[#171717] text-slate-50" : "bg-white text-slate-900",
        )}
      >
        <div
          className={cn(
            "w-full max-w-md rounded-3xl border p-8 text-center",
            isDark ? "border-[#090909] bg-[#090909]" : "border-input bg-white",
          )}
        >
          <div className="mb-6 flex flex-col items-center">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
              {currentUser.email?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-sm text-muted-foreground mb-4">
              You are currently signed in as <br />
              <span className="font-semibold text-foreground">
                {currentUser.email}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full text-base py-6 !bg-[#ffd700] !text-black"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span
                  className={cn(
                    "bg-background px-2 text-muted-foreground",
                    isDark ? "bg-[#090909]" : "bg-white",
                  )}
                >
                  or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // SCENARIO 2: NOT LOGGED IN (Show Form)

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-4",
        isDark ? "bg-[#171717] text-slate-50" : "bg-white text-slate-900",
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-3xl border p-6",
          isDark ? "border-[#090909] bg-[#090909]" : "border-input bg-white",
        )}
      >
        <div className="mb-6 text-center">
          <h1
            className={cn(
              "text-xl font-semibold",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            AlphaLeads
          </h1>
          <p
            className={cn(
              "mt-1 text-sm",
              isDark ? "text-slate-300" : "text-slate-700",
            )}
          >
            Sign in or create an account to manage your finances.
          </p>
        </div>

        {/* ÚJ: Google Login Gomb a form felett */}
        <div className="mb-4">
          <Button
            variant="outline"
            type="button"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span
                className={cn(
                  "bg-background px-2 text-muted-foreground",
                  isDark ? "bg-[#090909]" : "bg-white",
                )}
              >
                Or continue with
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
             {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              className="mt-2 w-full !bg-[#ffd700] !text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Working..." : "Sign in"}
            </Button>

            <Link
              href="/forgot-password"
              className="text-xs text-center text-muted-foreground hover:text-foreground hover:underline py-1"
            >
              Forgot password?
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-1"></p>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignUp}
              disabled={isSubmitting}
              title={
                
                  "Create a new account"
              }
            >
              Register Now
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
