import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface SplitSubject {
  code: string;
  name: string;
  num_batches: number;
}

interface BatchSelectionFormProps {
  rollNumber: string;
  onSubmit: (batches: Record<string, "B1" | "B2" | "B3">) => void;
}

export function BatchSelectionForm({ rollNumber, onSubmit }: BatchSelectionFormProps) {
  const [subjects, setSubjects] = useState<SplitSubject[]>([]);
  const [batches, setBatches] = useState<Record<string, "B1" | "B2" | "B3">>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchSplitSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("code, name, num_batches")
        .eq("split_students", true)
        .order("code", { ascending: true });

      if (data) {
        const filtered = data.filter((s) => s.num_batches && s.num_batches > 1) as SplitSubject[];
        setSubjects(filtered);
        const initial: Record<string, "B1" | "B2" | "B3"> = {};
        filtered.forEach((s) => { initial[s.code] = "B1"; });
        setBatches(initial);
      }
      setIsFetching(false);
    };
    fetchSplitSubjects();
  }, []);

  const getBatchOptions = (numBatches: number): string[] => {
    const allBatches = ["B1", "B2", "B3"];
    return allBatches.slice(0, Math.min(numBatches, 3));
  };

  const handleBatchChange = (courseCode: string, batch: "B1" | "B2" | "B3") => {
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

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        {subjects.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">No subjects require batch selection.</p>
        ) : (
          subjects.map((subject) => (
            <Card key={subject.code} className="p-4">
              <div className="mb-3">
                <p className="font-medium text-foreground text-sm">{subject.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>
              </div>
              <RadioGroup
                value={batches[subject.code]}
                onValueChange={(value) => handleBatchChange(subject.code, value as "B1" | "B2" | "B3")}
                className="flex gap-6"
              >
                {getBatchOptions(subject.num_batches).map((batch) => (
                  <div key={batch} className="flex items-center space-x-2">
                    <RadioGroupItem value={batch} id={`${subject.code}-${batch.toLowerCase()}`} />
                    <Label htmlFor={`${subject.code}-${batch.toLowerCase()}`} className="font-normal cursor-pointer">
                      {batch}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>
          ))
        )}
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
