import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signUpSchema, SignUpFormData } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface SignUpFormProps {
  onSuccess: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      batch: "B1",
    },
  });

  const selectedBatch = watch("batch");

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    
    try {
      // Check if roll number is already taken
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("roll_number")
        .eq("roll_number", data.rollNumber)
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: "Roll number already registered",
          description: "This roll number is already associated with an account.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({
            title: "Email already registered",
            description: "Please sign in instead or use a different email.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: authError.message,
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          name: data.name,
          roll_number: data.rollNumber,
          batch: data.batch,
        });

        if (profileError) {
          toast({
            title: "Profile creation failed",
            description: profileError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Account created!",
          description: "Welcome to CSD Timetable.",
        });
        
        onSuccess();
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="Enter your full name"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            {...register("password")}
            className={errors.password ? "border-destructive pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rollNumber">Roll Number</Label>
        <Input
          id="rollNumber"
          placeholder="e.g., 231701001"
          {...register("rollNumber")}
          className={errors.rollNumber ? "border-destructive" : ""}
        />
        {errors.rollNumber && (
          <p className="text-sm text-destructive">{errors.rollNumber.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Valid: 231701001-231701063 or 231701501
        </p>
      </div>

      <div className="space-y-3">
        <Label>Batch (for Lab Sessions)</Label>
        <RadioGroup
          value={selectedBatch}
          onValueChange={(value) => setValue("batch", value as "B1" | "B2")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="B1" id="b1" />
            <Label htmlFor="b1" className="font-normal cursor-pointer">
              Batch B1
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="B2" id="b2" />
            <Label htmlFor="b2" className="font-normal cursor-pointer">
              Batch B2
            </Label>
          </div>
        </RadioGroup>
        {errors.batch && (
          <p className="text-sm text-destructive">{errors.batch.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}
