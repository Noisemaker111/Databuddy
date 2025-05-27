"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { authClient } from "@databuddy/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="w-full max-w-md mx-auto mt-12 bg-card rounded-xl shadow p-6 border border-border relative overflow-hidden">
      <div className="text-center mb-8">
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
        <p className="text-muted-foreground mt-2">We'll send you a link to reset your password</p>
      </div>
      <form onSubmit={handleForgotPassword} className="space-y-4">
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
        <Link href="/login" className="block mt-4">
          <Button
            variant="outline"
            className="w-full"
            type="button"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </form>
    </div>
  );
} 