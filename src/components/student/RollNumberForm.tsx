import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { isValidRollNumber } from "@/lib/validations";

interface RollNumberFormProps {
  studentName: string;
  onSubmit: (rollNumber: string) => void;
  onBack: () => void;
}

export function RollNumberForm({ studentName, onSubmit, onBack }: RollNumberFormProps) {
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
      setError("Invalid roll number. Must be 231701001-231701063 or 231701501");
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
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Welcome, <span className="text-foreground font-medium">{studentName}</span>!
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rollNumber">Roll Number</Label>
        <Input
          id="rollNumber"
          placeholder="e.g., 231701001"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
          className={error ? "border-destructive" : ""}
          autoFocus
          inputMode="numeric"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Valid: 231701001-231701063 or 231701501
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="flex-1 gradient-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              View Timetable
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
