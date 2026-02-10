import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useStudent } from "@/hooks/useStudent";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, LogOut, FlaskConical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SplitSubject {
  code: string;
  name: string;
  num_batches: number;
}

export default function Settings() {
  const { student, getSubjectBatch, updateSubjectBatch, clearStudent } = useStudent();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [splitSubjects, setSplitSubjects] = useState<SplitSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSplitSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("code, name, num_batches")
        .eq("split_students", true)
        .order("code", { ascending: true });

      if (data) {
        setSplitSubjects(data.filter((s) => s.num_batches && s.num_batches > 1) as SplitSubject[]);
      }
      setIsLoading(false);
    };

    fetchSplitSubjects();
  }, []);

  const handleBatchChange = async (courseCode: string, batch: "B1" | "B2" | "B3") => {
    await updateSubjectBatch(courseCode, batch);
    const subject = splitSubjects.find((s) => s.code === courseCode);
    toast({
      title: "Batch updated",
      description: `${subject?.name || courseCode} set to Batch ${batch}`,
    });
  };

  const handleClearSession = () => {
    clearStudent();
    navigate("/entry");
  };

  if (!student?.rollNumber) {
    navigate("/entry");
    return null;
  }

  // Generate batch options based on num_batches
  const getBatchOptions = (numBatches: number): string[] => {
    const allBatches = ["B1", "B2", "B3"];
    return allBatches.slice(0, Math.min(numBatches, 3));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Timetable
        </Button>

        <Card className="animate-fade-in mb-6">
          <CardHeader>
            <CardTitle className="font-space text-2xl">User Settings</CardTitle>
            <CardDescription>Manage your timetable preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current User Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-medium text-foreground font-mono">{student.rollNumber}</p>
            </div>

            {/* Per-Subject Batch Selection */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-lab" />
                <h3 className="font-medium text-foreground">Lab Batch Preferences</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Select your batch for each lab subject. This will filter your timetable to show only your selected batch sessions.
              </p>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : splitSubjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No subjects with batch splitting configured.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {splitSubjects.map((subject) => (
                    <div key={subject.code} className="p-4 bg-card border rounded-lg">
                      <div className="mb-3">
                        <p className="font-medium text-foreground">{subject.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>
                      </div>
                      <RadioGroup
                        value={getSubjectBatch(subject.code)}
                        onValueChange={(value) => handleBatchChange(subject.code, value as "B1" | "B2" | "B3")}
                        className="flex gap-4"
                      >
                        {getBatchOptions(subject.num_batches).map((batch) => (
                          <div key={batch} className="flex items-center space-x-2">
                            <RadioGroupItem value={batch} id={`${subject.code}-${batch.toLowerCase()}`} />
                            <Label
                              htmlFor={`${subject.code}-${batch.toLowerCase()}`}
                              className="font-normal cursor-pointer"
                            >
                              Batch {batch}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Actions */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-foreground mb-2">Session</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clear your session to use a different roll number.
              </p>
              <Button
                variant="destructive"
                onClick={handleClearSession}
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Clear Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
