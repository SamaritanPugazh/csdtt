import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { isValidRollNumber } from "@/lib/validations";

interface RollNumberFormProps {
  onSubmit: (rollNumber: string) => void;
}

export function RollNumberForm({ onSubmit }: RollNumberFormProps) {
  const [rollNumber, setRollNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = rollNumber.trim();
    
    if (!trimmed) {
      setError("Please enter your roll number");
      return;
    }

    if (!/^\d{9}$/.test(trimmed)) {
      setError("Roll number must be exactly 9 digits");
      return;
    }

    if (!isValidRollNumber(trimmed)) {
      setError("Invalid roll number");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onSubmit(trimmed);
      setIsLoading(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rollNumber">Roll Number</Label>
        <Input
          id="rollNumber"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
          className={error ? "border-destructive" : ""}
          autoFocus
          inputMode="numeric"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
