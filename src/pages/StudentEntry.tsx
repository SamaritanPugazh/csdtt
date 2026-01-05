import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RollNumberForm } from "@/components/student/RollNumberForm";
import { BatchSelectionForm } from "@/components/student/BatchSelectionForm";
import { useStudent } from "@/hooks/useStudent";
import { Calendar } from "lucide-react";

type Step = "rollNumber" | "batchSelection";

export default function StudentEntry() {
  const [step, setStep] = useState<Step>("rollNumber");
  const { student, isLoading, isNewStudent, setRollNumber, saveBatchPreferences } = useStudent();
  const navigate = useNavigate();

  useEffect(() => {
    // If student already has data and is not new, redirect to dashboard
    if (!isLoading && student?.rollNumber && isNewStudent === false) {
      navigate("/");
    }
  }, [student, isLoading, isNewStudent, navigate]);

  const handleRollNumberSubmit = async (rollNumber: string) => {
    const success = await setRollNumber(rollNumber);
    if (success) {
      // isNewStudent will be set after setRollNumber completes
      // We need to wait for the next render to check
    }
  };

  // Watch for isNewStudent to determine next step
  useEffect(() => {
    if (student?.rollNumber && isNewStudent !== null) {
      if (isNewStudent) {
        setStep("batchSelection");
      } else {
        navigate("/");
      }
    }
  }, [student?.rollNumber, isNewStudent, navigate]);

  const handleBatchSubmit = async (batches: Record<string, "B1" | "B2">) => {
    await saveBatchPreferences(batches);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 animate-pulse-glow">
            <Calendar className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-space">CSD Timetable</CardTitle>
          <CardDescription>
            {step === "rollNumber" 
              ? "Enter your roll number to access your timetable" 
              : "Select your batch for each lab subject"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "rollNumber" ? (
            <RollNumberForm onSubmit={handleRollNumberSubmit} />
          ) : (
            <BatchSelectionForm
              rollNumber={student?.rollNumber || ""}
              onSubmit={handleBatchSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
