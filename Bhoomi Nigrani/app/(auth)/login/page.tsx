"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { isLoaded: isSignInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  // Mode: "sign-in" or "sign-up"
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Handle Sign In Submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (isSignInLoaded && signIn) {
        const result = await signIn.create({
          identifier: email.trim(),
          password,
        });

        if (result.status === "complete" && setActiveSignIn) {
          await setActiveSignIn({ session: result.createdSessionId });
          router.push(redirectPath);
          return;
        } else if (result.status === "needs_first_factor" || result.status === "needs_second_factor") {
          setError("Multi-factor verification required. Please check your authenticator or email.");
          setLoading(false);
          return;
        }
      }

      // Fallback to internal login route if Clerk key is unset or unconfigured
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error?.message || "Invalid credentials. Please verify your official email and password.");
        setLoading(false);
        return;
      }

      window.location.href = redirectPath;
    } catch (err: any) {
      console.error("Sign in error:", err);
      const clerkErrMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      setError(clerkErrMsg || err?.message || "Authentication error. Please check your credentials.");
      setLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    if (!isSignUpLoaded || !signUp) {
      setError("Authentication service initializing. Please try again in a moment.");
      setLoading(false);
      return;
    }

    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      if (result.status === "complete" && setActiveSignUp) {
        await setActiveSignUp({ session: result.createdSessionId });
        router.push(redirectPath);
        return;
      }

      // If Clerk requires email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
      setInfoMsg(`A 6-digit verification code has been dispatched to ${email.trim()}.`);
      setLoading(false);
    } catch (err: any) {
      console.error("Sign up error:", err);
      const clerkErrMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      setError(clerkErrMsg || err?.message || "Failed to create account. Please verify input fields.");
      setLoading(false);
    }
  };

  // Handle Verification Code Submit
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isSignUpLoaded || !signUp) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === "complete" && setActiveSignUp) {
        await setActiveSignUp({ session: completeSignUp.createdSessionId });
        router.push(redirectPath);
      } else {
        setError("Verification was not completed. Please re-enter the code or request a new one.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      const clerkErrMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      setError(clerkErrMsg || err?.message || "Invalid verification code.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 p-3 sm:p-4 gap-4 sm:gap-6 transition-colors">
      {/* LEFT VISUAL BRANDING PANEL */}
      <div className="bg-[#C7E4FA] dark:bg-slate-950 rounded-xl p-6 sm:p-8 flex flex-col justify-between text-[#2F3A4A] dark:text-slate-200 relative overflow-hidden min-h-[380px] md:min-h-[500px] border border-transparent dark:border-slate-800">
        {/* Top Status Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-[#D7E2EC] dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{t("login.officialPortal")}</span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-[10px] font-mono">
            {t("login.secureGateway")}
          </div>
        </div>

        {/* Center Brand Showcase with Real Bhoomi Sanket Logo */}
        <div className="my-auto flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <img
              src="/bhoomi-sanket-emblem-circle.png"
              alt="Bhoomi Sanket"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#2F3A4A] dark:text-slate-100">
              भूमि SANKET-AI
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium max-w-xs leading-relaxed">
              {t("login.tagline")}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-[#D7E2EC] dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 tracking-wider">
            <span>{t("login.land")}</span>
            <span className="text-slate-500">•</span>
            <span>{t("login.government")}</span>
            <span className="text-slate-500">•</span>
            <span>{t("login.citizen")}</span>
          </div>
        </div>

        {/* Footer Subtext */}
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono text-center pt-3 border-t border-[#D7E2EC] dark:border-slate-800">
          {t("login.footerText")}
        </div>
      </div>

      {/* RIGHT AUTH FORM PANEL */}
      <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
        {verifying ? (
          /* EMAIL VERIFICATION STEP */
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => {
                  setVerifying(false);
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 -ml-1 rounded cursor-pointer transition-colors"
                title="Back to registration"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t("login.verifyEmail")}</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {t("login.verifyDesc")}
            </p>

            {infoMsg && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t("login.verificationCode")}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-sm font-mono tracking-widest pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length < 6}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? t("login.verifying") : t("login.activate")}
              </button>
            </form>
          </div>
        ) : (
          /* STANDARD SIGN IN / SIGN UP FORM */
          <div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {mode === "sign-in" ? t("login.signIn") : t("login.createAccount")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {mode === "sign-in"
                  ? t("login.signInDesc")
                  : t("login.signUpDesc")}
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={mode === "sign-in" ? handleSignIn : handleSignUp} className="mt-6 space-y-4">
              {/* Optional Name Fields for Sign Up */}
              {mode === "sign-up" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t("login.firstName")}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Aditi"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t("login.lastName")}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Sharma"
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t("login.email")}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@bhoomisanket.gov.in"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Password Field with Visibility Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t("login.password")}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Extras: Remember Me & Forgot Password */}
              {mode === "sign-in" && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>{t("login.rememberMe")}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => alert("Please contact the Department Administrator to reset access credentials.")}
                    className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    {t("login.forgotPassword")}
                  </button>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>{t("login.processing")}</span>
                ) : mode === "sign-in" ? (
                  <span>{t("login.login")}</span>
                ) : (
                  <span>{t("login.createAccount")}</span>
                )}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
              {mode === "sign-in" ? (
                <span>
                  {t("login.noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("sign-up");
                      setError(null);
                    }}
                    className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold underline cursor-pointer"
                  >
                    {t("login.signUp")}
                  </button>
                </span>
              ) : (
                <span>
                  {t("login.alreadyRegistered")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("sign-in");
                      setError(null);
                    }}
                    className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold underline cursor-pointer"
                  >
                    {t("login.signIn")}
                  </button>
                </span>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500">
              {t("login.authorizedOnly")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useT();

  return (
    <Suspense
      fallback={
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500 shadow-xl max-w-sm mx-auto">
          {t("login.loadingPortal")}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

