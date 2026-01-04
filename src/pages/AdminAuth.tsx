import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

const ADMIN_EMAIL = "pugazhendhi2k5@gmail.com";

export default function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Check if admin exists
  useEffect(() => {
    const checkAdminExists = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "admin")
        .limit(1);
      
      setAdminExists(data && data.length > 0);
    };
    checkAdminExists();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if user is admin after login
      const { data: { user: loggedInUser } } = await supabase.auth.getUser();
      if (loggedInUser) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", loggedInUser.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          await supabase.auth.signOut();
          toast({
            title: "Access denied",
            description: "You do not have admin privileges.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Welcome, Admin!",
          description: "You have successfully logged in.",
        });
        navigate("/admin");
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast({
        title: "Invalid email",
        description: "Please use the designated admin email.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/admin`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        toast({
          title: "Setup failed",
          description: authError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Add admin role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "admin",
        });

        if (roleError) {
          toast({
            title: "Role assignment failed",
            description: roleError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Admin account created!",
          description: "You can now log in with your credentials.",
        });
        
        setMode("login");
        setAdminExists(true);
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-destructive/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-space">
            {mode === "login" ? "Admin Login" : "Admin Setup"}
          </CardTitle>
          <CardDescription>
            {mode === "login" 
              ? "Sign in with your admin credentials" 
              : "Create the admin account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === "login" ? handleLogin : handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={mode === "setup" ? ADMIN_EMAIL : "Enter admin email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {mode === "setup" && (
                <p className="text-xs text-muted-foreground">
                  Must be: {ADMIN_EMAIL}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "setup" ? "Create a password" : "Enter password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
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

            <Button type="submit" className="w-full" variant="destructive" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                mode === "login" ? "Sign In as Admin" : "Create Admin Account"
              )}
            </Button>
          </form>

          {/* Toggle between login and setup */}
          {adminExists === false && mode === "login" && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">No admin account exists yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("setup")}
              >
                Set Up Admin Account
              </Button>
            </div>
          )}

          {mode === "setup" && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("login")}
              >
                Back to Login
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Student View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
