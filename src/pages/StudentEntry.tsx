import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NameEntryForm } from "@/components/student/NameEntryForm";
import { RollNumberForm } from "@/components/student/RollNumberForm";
import { useStudent } from "@/hooks/useStudent";
import { Calendar } from "lucide-react";

type Step = "name" | "rollNumber";

export default function StudentEntry() {
  const [step, setStep] = useState<Step>("name");
  const [tempName, setTempName] = useState("");
  const { student, isLoading, setStudentName, setRollNumber } = useStudent();
  const navigate = useNavigate();

  useEffect(() => {
    // If student already has complete data, redirect to dashboard
    if (!isLoading && student?.name && student?.rollNumber) {
      navigate("/");
    }
  }, [student, isLoading, navigate]);

  const handleNameSubmit = (name: string) => {
    setTempName(name);
    setStudentName(name);
    setStep("rollNumber");
  };

  const handleRollNumberSubmit = (rollNumber: string) => {
    const success = setRollNumber(rollNumber);
    if (success) {
      navigate("/");
    }
  };

  const handleBack = () => {
    setStep("name");
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
            {step === "name" 
              ? "Enter your name to get started" 
              : "Enter your roll number to view your timetable"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "name" ? (
            <NameEntryForm onSubmit={handleNameSubmit} />
          ) : (
            <RollNumberForm
              studentName={tempName}
              onSubmit={handleRollNumberSubmit}
              onBack={handleBack}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
