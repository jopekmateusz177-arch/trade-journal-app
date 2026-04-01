"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useEffect } from "react";



export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: "http://localhost:3000/auth/callback",
  },
});

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Account created. Check your email if confirmation is required.");
    } finally {
      setLoading(false);
    }
  }

async function handleSignIn() {
  try {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Signed in successfully.");
    router.push("/trades");
    router.refresh();
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      router.push("/trades");
    }
  };

  checkUser();
}, []);


  return (
    <div className="min-h-screen bg-[#0a0f1a] text-[#e5e7eb]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-8 md:px-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f1629] shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-white/10 p-8 md:border-b-0 md:border-r md:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#94a3b8]">
              Trading Journal Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome back
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#94a3b8] md:text-base">
              Sign in to access your journal, review trade history, track your
              execution mistakes, and keep your performance data synced to your
              account.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#131c31] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                  Secure Login
                </p>
                <p className="mt-2 text-sm font-medium text-[#e5e7eb]">
                  Supabase Auth
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#131c31] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                  Storage
                </p>
                <p className="mt-2 text-sm font-medium text-[#e5e7eb]">
                  Cloud Synced
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#131c31] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                  Focus
                </p>
                <p className="mt-2 text-sm font-medium text-[#e5e7eb]">
                  Execution Review
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Login to your account
                </h2>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  Use your email and password to sign up or sign in.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#64748b] focus:border-[#2962ff] focus:ring-2 focus:ring-[#2962ff]/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#64748b] focus:border-[#2962ff] focus:ring-2 focus:ring-[#2962ff]/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="rounded-2xl bg-[#2962ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3b73ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Working..." : "Sign Up"}
                  </button>

                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-medium text-[#dbe4ff] transition hover:border-[#2962ff]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Working..." : "Sign In"}
                  </button>
                </div>

                {message && (
                  <div className="rounded-2xl border border-white/10 bg-[#131c31] px-4 py-3 text-sm text-[#cbd5e1]">
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}