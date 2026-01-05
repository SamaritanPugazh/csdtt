import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BatchSelectionFormProps {
  rollNumber: string;
  onSubmit: (batches: Record<string, "B1" | "B2">) => void;
}

const SUBJECTS = [
  { code: "CD23631", name: "Game Design & Development" },
  { code: "CD23632", name: "3D Rigging & Animation" },
  { code: "AI23331", name: "Fundamentals of Machine Learning" },
];

export function BatchSelectionForm({ rollNumber, onSubmit }: BatchSelectionFormProps) {
  const [batches, setBatches] = useState<Record<string, "B1" | "B2">>({
    CD23631: "B1",
    CD23632: "B1",
    AI23331: "B1",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleBatchChange = (courseCode: string, batch: "B1" | "B2") => {
    setBatches((prev) => ({ ...prev, [courseCode]: batch }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onSubmit(batches);
      setIsLoading(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-2">
        <p className="text-muted-foreground">
          Roll Number: <span className="text-foreground font-mono font-medium">{rollNumber}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Select your batch for each lab subject
        </p>
      </div>

      <div className="space-y-4">
        {SUBJECTS.map((subject) => (
          <Card key={subject.code} className="p-4">
            <div className="mb-3">
              <p className="font-medium text-foreground text-sm">{subject.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>
            </div>
            <RadioGroup
              value={batches[subject.code]}
              onValueChange={(value) => handleBatchChange(subject.code, value as "B1" | "B2")}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="B1" id={`${subject.code}-b1`} />
                <Label htmlFor={`${subject.code}-b1`} className="font-normal cursor-pointer">
                  B1
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="B2" id={`${subject.code}-b2`} />
                <Label htmlFor={`${subject.code}-b2`} className="font-normal cursor-pointer">
                  B2
                </Label>
              </div>
            </RadioGroup>
          </Card>
        ))}
      </div>

      <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            View Timetable
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
