"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Lock, Loader2 } from "lucide-react";

interface AuthFormProps {
  mode?: "login" | "register";
}

export default function AuthForm({ mode: initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        if (error) throw error;
        
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => router.push("/"), 1500);
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        if (error) throw error;
        
        setSuccess("Registration successful! Please check your email to confirm your account.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--clr-surface-a10)' }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <User 
              className="h-12 w-12" 
              style={{ color: 'var(--clr-info-a20)' }}
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <p style={{ color: 'var(--clr-primary-a40)' }}>
            {mode === "login" 
              ? "Sign in to your Pryleaf account" 
              : "Join Pryleaf to start chatting and tracking investments"
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label 
                className="text-sm font-medium"
                style={{ color: 'var(--clr-primary-a50)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                  style={{ color: 'var(--clr-primary-a30)' }}
                />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label 
                className="text-sm font-medium"
                style={{ color: 'var(--clr-primary-a50)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                  style={{ color: 'var(--clr-primary-a30)' }}
                />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div 
                className="border px-4 py-3 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--clr-danger-a0)',
                  borderColor: 'var(--clr-danger-a10)',
                  color: 'var(--clr-danger-a20)'
                }}
              >
                {error}
              </div>
            )}
            
            {success && (
              <div 
                className="border px-4 py-3 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--clr-success-a0)',
                  borderColor: 'var(--clr-success-a10)',
                  color: 'var(--clr-success-a20)'
                }}
              >
                {success}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p 
              className="text-sm"
              style={{ color: 'var(--clr-primary-a40)' }}
            >
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <a 
                    href="/register" 
                    className="font-medium hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--clr-info-a20)' }}
                  >
                    Sign up
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <a 
                    href="/login" 
                    className="font-medium hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--clr-info-a20)' }}
                  >
                    Sign in
                  </a>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
