import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";

interface NameEntryFormProps {
  onSubmit: (name: string) => void;
}

export function NameEntryForm({ onSubmit }: NameEntryFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Name must be less than 100 characters");
      return;
    }

    setIsLoading(true);
    // Small delay for UX
    setTimeout(() => {
      onSubmit(trimmedName);
      setIsLoading(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={error ? "border-destructive" : ""}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
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
