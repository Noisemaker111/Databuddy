"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { authClient, signIn } from "@databuddy/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Loader2, ChevronLeft, Sparkles, Eye, EyeOff, AlertCircle, CheckCircle2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import Iridescence from "@/components/bits/Iridiscence";

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"password" | "magic" | "forgot" | "magic-sent" | "verification-needed">("password");
  const [verifyingToken, setVerifyingToken] = useState(false);

  // Check for magic link token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setVerifyingToken(true);
      verifyMagicLink(token);
    }
  }, [searchParams]);

  const verifyMagicLink = async (token: string) => {
    try {
      const { error } = await authClient.magicLink.verify({
        query: { token },
        fetchOptions: {
          onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token")
            if (authToken) {
              localStorage.setItem("authToken", authToken);
            }
          },
          onError: () => {
            toast.error("Failed to verify magic link. Please try again.");
            router.push("/login");
          }
        }
      });

      if (error) {
        toast.error("Invalid or expired magic link. Please try again.");
        router.push("/login");
      } else {
        toast.success("Login successful!");
        router.push("/home");
      }
    } catch (error) {
      toast.error("Failed to verify magic link. Please try again.");
      router.push("/login");
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn.social({
      provider: "google",
      callbackURL: "/home",
      fetchOptions: {
        onSuccess: (ctx) => {
          toast.success("Login successful!");
          const authToken = ctx.response.headers.get("set-auth-token")
          if (authToken) {
            localStorage.setItem("authToken", authToken);
          }
        },
        onError: () => {
          setIsLoading(false);
          toast.error("Google login failed. Please try again.");
        },
      },
    });
  };

  const handleGithubLogin = () => {
    setIsLoading(true);
    signIn.social({
      provider: "github",
      callbackURL: "/home",
      fetchOptions: {
        onSuccess: (ctx) => {
          toast.success("Login successful!");
          const authToken = ctx.response.headers.get("set-auth-token")
          if (authToken) {
            localStorage.setItem("authToken", authToken);
          }
        },
        onError: () => {
          setIsLoading(false);
          toast.error("GitHub login failed. Please try again.");
        },
      },
    });
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/home",
        fetchOptions: {
          onSuccess: (ctx) => {
            toast.success("Login successful!");
            const authToken = ctx.response.headers.get("set-auth-token")
            if (authToken) {
              localStorage.setItem("authToken", authToken);
            }
          },
          onError: (error: any) => {
            setIsLoading(false);
            if (error?.code === "EMAIL_NOT_VERIFIED" || error?.message?.toLowerCase().includes("not verified")) {
              setView("verification-needed");
            } else {
              toast.error(error?.message || "Login failed. Please check your credentials and try again.");
            }
          },
        },
      });

      if (result?.error) {
        toast.error("Invalid credentials");
        return;
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    setIsLoading(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/home",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification email sent!");
            setIsLoading(false);
          },
          onError: () => {
            setIsLoading(false);
            toast.error("Failed to send verification email. Please try again later.");
          },
        },
      });
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to send verification email. Please try again later.");
    }
  };

  const handleMagicLinkLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await signIn.magicLink({
        email,
        callbackURL: "/home",
        fetchOptions: {
          onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token")
            if (authToken) {
              localStorage.setItem("authToken", authToken);
            }
            setIsLoading(false);
            toast.success("Magic link sent! Please check your email.");
            setView("magic-sent");
          },
          onError: () => {
            setIsLoading(false);
            toast.error("Failed to send magic link. Please try again.");
          },
        },
      });
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to send magic link. Please try again.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.forgetPassword({
        email,
        fetchOptions: {
          onSuccess: () => {
            setIsLoading(false);
            toast.success("Password reset instructions sent to your email.");
          },
          onError: () => {
            setIsLoading(false);
            toast.error("Failed to send reset instructions. Please try again.");
          },
        },
      });
    } catch (error) {
      setIsLoading(false);
      toast.error("An error occurred. Please try again later.");
    }
  };

  // Show loading spinner while verifying token
  if (verifyingToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 blur-xl" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <p className="text-muted-foreground font-medium">Verifying your login...</p>
        </div>
      </div>
    );
  }

  // Render different forms based on the current view
  const renderForm = () => {
    switch (view) {
      case "magic-sent":
        return (
          <div className="space-y-5 py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
              <p className="text-sm">
                We've sent a magic link to <strong>{email}</strong>. Please check your inbox and click the link to sign in instantly.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isLoading}
                onClick={(e: React.MouseEvent) => handleMagicLinkLogin(e as any)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend magic link"
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50"
                onClick={() => setView("password")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </div>
        );
      case "verification-needed":
        return (
          <div className="space-y-5 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <p className="text-sm">
                Your email <strong>{email}</strong> needs to be verified before you can sign in. Please check your inbox for the verification link.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isLoading}
                onClick={sendVerificationEmail}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => setView("password")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </div>
        );
      case "forgot":
        return (
          <div className="space-y-5 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-foreground font-medium">Email address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="name@example.com"
                />
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                Enter your email address and we'll send you a link to reset your password.
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 bg-primary"
                disabled={isLoading}
                onClick={handleForgotPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setView("password")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </div>
        );
      case "magic":
        return (
          <div className="space-y-5 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email" className="text-foreground font-medium">Email address</Label>
                <Input
                  id="magic-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="name@example.com"
                />
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <p>We'll send a secure link to your email that will sign you in instantly — no password needed.</p>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isLoading}
                onClick={handleMagicLinkLogin}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Send magic link
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50"
                onClick={() => setView("password")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center h-11 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                onClick={handleGithubLogin}
                disabled={isLoading}
              >
                <Github className="mr-2 h-5 w-5" />
                Sign in with GitHub
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center h-11 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <Mail className="mr-2 h-5 w-5" />
                Sign in with Google
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground font-medium">
                  or continue with
                </span>
              </div>
            </div>
            
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <Button
                    variant="link"
                    className="text-xs text-primary p-0 h-auto cursor-pointer"
                    onClick={() => setView("forgot")}
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 shadow relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              
              <Button
                type="button"
                variant="link"
                className="w-full text-primary hover:text-primary/80 font-medium flex items-center justify-center"
                onClick={() => setView("magic")}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Sign in with magic link
              </Button>
            </form>
          </div>
        );
    }
  };

  // Page title and header content based on current view
  const getHeaderContent = () => {
    switch (view) {
      case "magic-sent":
        return (
          <>
            <div className="inline-flex justify-center items-center p-3 bg-blue-100 rounded-full mb-5 relative w-16 h-16">
              <div className="absolute inset-0 bg-blue-50 rounded-full animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-200 to-blue-100 rounded-full blur-md opacity-70" />
              <div className="relative bg-gradient-to-tr from-blue-500 to-blue-400 rounded-full p-2.5">
                <MailCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <p className="text-muted-foreground mt-2">
              Magic link sent to <strong className="text-blue-600 font-medium">{email}</strong>
            </p>
          </>
        );
      case "verification-needed":
        return (
          <>
            <div className="inline-flex justify-center items-center p-3 bg-amber-100 rounded-full mb-5 relative w-16 h-16">
              <div className="absolute inset-0 bg-amber-50 rounded-full animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-200 to-amber-100 rounded-full blur-md opacity-70" />
              <div className="relative bg-gradient-to-tr from-amber-500 to-amber-400 rounded-full p-2.5">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
            <p className="text-muted-foreground mt-2">
              Verification needed for <strong className="text-amber-600 font-medium">{email}</strong>
            </p>
          </>
        );
      case "forgot":
        return (
          <>
            <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-5 relative w-16 h-16">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-primary/10 rounded-full blur-md opacity-70" />
              <div className="relative bg-gradient-to-tr from-primary to-primary/80 rounded-full p-2.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-labelledby="logoTitle">
                  <title id="logoTitle">Databuddy Logo</title>
                  <path d="M12 15V17M12 7V13M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
            <p className="text-muted-foreground mt-2">
              We'll send you a link to reset your password
            </p>
          </>
        );
      case "magic":
        return (
          <>
            <div className="inline-flex justify-center items-center p-3 bg-blue-100 rounded-full mb-5 relative w-16 h-16">
              <div className="absolute inset-0 bg-blue-50 rounded-full animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-200 to-blue-100 rounded-full blur-md opacity-70" />
              <div className="relative bg-gradient-to-tr from-blue-500 to-blue-400 rounded-full p-2.5">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sign in with magic link</h1>
            <p className="text-muted-foreground mt-2">
              No password needed — just use your email
            </p>
          </>
        );
      default:
        return (
          <>
            <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-5 relative w-16 h-16">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-primary/10 rounded-full blur-md opacity-70" />
              <div className="relative bg-gradient-to-tr from-primary to-primary/80 rounded-full p-2.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-labelledby="logoTitle">
                  <title id="logoTitle">Databuddy Logo</title>
                  <path d="M8 12H16M12 8V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue your journey with Databuddy
            </p>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen">
      {/* Iridescence side - Left column */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-start justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Iridescence 
            color={[0.1, 0.2, 0.9]} 
            speed={0.5} 
            amplitude={0.2} 
            mouseReact={true} 
          />
        </div>
        
        <Button variant="outline" className="relative z-10 bg-white/20 text-white border-white/10 hover:bg-white/30">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="relative z-10 text-white">
          <div className="mb-2 text-sm font-medium uppercase tracking-wide">databuddy</div>
          <h1 className="text-4xl font-bold mb-4">
            Build better <br />products with <br />Databuddy
          </h1>
          <p className="text-white/70 max-w-md">
            Connect your data sources, build insights, and share them with your team.
          </p>
        </div>
      </div>
      
      {/* Auth form side - Right column */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background overflow-auto">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6 md:hidden">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">databuddy</div>
          </div>
          
          <div className="text-center mb-8">
            {getHeaderContent()}
          </div>
          
          <div className="bg-card rounded-xl shadow p-6 border border-border relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              {renderForm()}
            </div>
          </div>
          
          {view === "password" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  href="/register" 
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 blur-xl" />
          <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
        </div>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
} 