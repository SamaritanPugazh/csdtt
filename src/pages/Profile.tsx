import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, User, Hash, Users } from "lucide-react";

export default function Profile() {
  const { profile, refreshProfile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedBatch, setSelectedBatch] = useState<"B1" | "B2">(profile?.batch || "B1");
  const [isSaving, setIsSaving] = useState(false);

  if (authLoading || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse text-center text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  const handleSave = async () => {
    if (selectedBatch === profile.batch) {
      toast({
        title: "No changes",
        description: "Your batch is already set to " + selectedBatch,
      });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ batch: selectedBatch })
      .eq("user_id", profile.user_id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await refreshProfile();
      toast({
        title: "Profile updated",
        description: `Your batch has been changed to ${selectedBatch}`,
      });
    }
    setIsSaving(false);
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

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="font-space text-2xl">Profile Settings</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <div className="text-lg font-medium text-foreground">{profile.name}</div>
            </div>

            {/* Roll Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-4 h-4" />
                Roll Number
              </Label>
              <div className="text-lg font-mono font-medium text-foreground">
                {profile.roll_number}
              </div>
            </div>

            {/* Batch Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                Lab Batch
              </Label>
              <RadioGroup
                value={selectedBatch}
                onValueChange={(value) => setSelectedBatch(value as "B1" | "B2")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B1" id="batch-b1" />
                  <Label htmlFor="batch-b1" className="font-normal cursor-pointer">
                    Batch B1
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B2" id="batch-b2" />
                  <Label htmlFor="batch-b2" className="font-normal cursor-pointer">
                    Batch B2
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                This affects which lab sessions appear in your timetable for batch-specific courses.
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving || selectedBatch === profile.batch}
              className="w-full gradient-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
