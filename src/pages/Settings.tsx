import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useStudent, BATCH_CONFIGURABLE_COURSES } from "@/hooks/useStudent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, LogOut, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COURSE_NAMES: Record<string, string> = {
  "AI23331": "Fundamentals of Machine Learning",
  "CD23631": "Game Design & Development",
  "CD23632": "3D Rigging & Animation",
};

export default function Settings() {
  const { student, getSubjectBatch, updateSubjectBatch, clearStudent } = useStudent();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBatchChange = async (courseCode: string, batch: "B1" | "B2") => {
    await updateSubjectBatch(courseCode, batch);
    toast({
      title: "Batch updated",
      description: `${COURSE_NAMES[courseCode] || courseCode} set to Batch ${batch}`,
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

              <div className="space-y-6">
                {BATCH_CONFIGURABLE_COURSES.map((courseCode) => (
                  <div key={courseCode} className="p-4 bg-card border rounded-lg">
                    <div className="mb-3">
                      <p className="font-medium text-foreground">
                        {COURSE_NAMES[courseCode] || courseCode}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{courseCode}</p>
                    </div>
                    <RadioGroup
                      value={getSubjectBatch(courseCode)}
                      onValueChange={(value) => handleBatchChange(courseCode, value as "B1" | "B2")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="B1" id={`${courseCode}-b1`} />
                        <Label htmlFor={`${courseCode}-b1`} className="font-normal cursor-pointer">
                          Batch B1
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="B2" id={`${courseCode}-b2`} />
                        <Label htmlFor={`${courseCode}-b2`} className="font-normal cursor-pointer">
                          Batch B2
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
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
