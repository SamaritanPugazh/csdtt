import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, X, Loader2, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeacherManager } from "./TeacherManager";
import { SubjectManager } from "./SubjectManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimePicker } from "@/components/ui/time-picker";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

interface Teacher {
  id: string;
  teacher_code?: string | null;
  title: string;
  name: string;
  department: string | null;
  status: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string | null;
  split_students?: boolean;
  num_batches?: number | null;
}

interface TimetableEntry {
  id: string;
  day: string;
  time_slot: string;
  course_code: string;
  subject_name: string;
  class_type: "Theory" | "Lab";
  batch: "B1" | "B2" | "ALL";
  room_number: string;
  staff_name?: string;
}

interface TimetableEntryFormProps {
  editingEntry?: TimetableEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
  existingEntries: TimetableEntry[];
}

export function TimetableEntryForm({
  editingEntry,
  onSuccess,
  onCancel,
  existingEntries,
}: TimetableEntryFormProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    day: "Tuesday" as (typeof DAYS)[number],
    start_time: "09:00",
    end_time: "10:00",
    class_type: "Theory" as "Theory" | "Lab",
    batch: "ALL" as "B1" | "B2" | "ALL",
    room_number: "",
  });

  useEffect(() => {
    if (editingEntry) {
      // Parse time_slot to get start and end times
      const parts = editingEntry.time_slot.includes(" - ") 
        ? editingEntry.time_slot.split(" - ") 
        : editingEntry.time_slot.split("-");
      const startTime = parts[0]?.trim() || "09:00";
      const endTime = parts[1]?.trim() || "10:00";
      
      setFormData({
        day: editingEntry.day as (typeof DAYS)[number],
        start_time: startTime,
        end_time: endTime,
        class_type: editingEntry.class_type,
        batch: editingEntry.batch,
        room_number: editingEntry.room_number,
      });
    }
  }, [editingEntry]);

  // Generate time_slot string from start and end times
  const getTimeSlot = () => `${formData.start_time} - ${formData.end_time}`;

  // Check for conflicts
  useEffect(() => {
    if (!formData.day || !formData.start_time || !formData.end_time || !formData.room_number) {
      setConflict(null);
      return;
    }

    const timeSlot = getTimeSlot();
    const conflictingEntry = existingEntries.find((entry) => {
      if (editingEntry && entry.id === editingEntry.id) return false;
      
      return (
        entry.day === formData.day &&
        entry.time_slot === timeSlot &&
        entry.room_number === formData.room_number
      );
    });

    if (conflictingEntry) {
      setConflict(
        `Room ${formData.room_number} is already booked for ${conflictingEntry.subject_name} at this time`
      );
    } else {
      setConflict(null);
    }
  }, [formData.day, formData.start_time, formData.end_time, formData.room_number, existingEntries, editingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject) {
      toast({
        title: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_time || !formData.end_time || !formData.room_number) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Validate day is a working day (database only supports Tue-Sat)
    const workingDays = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (!workingDays.includes(formData.day)) {
      toast({
        title: "Invalid day selected",
        description: "Only Tuesday through Saturday are valid working days",
        variant: "destructive",
      });
      return;
    }

    if (conflict) {
      toast({
        title: "Cannot save due to conflict",
        description: conflict,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const timeSlot = getTimeSlot();
    const payload = {
      day: formData.day as "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday",
      time_slot: timeSlot,
      course_code: selectedSubject.code,
      subject_name: selectedSubject.name,
      class_type: formData.class_type,
      batch: formData.batch,
      room_number: formData.room_number,
      staff_name: selectedTeacher ? `${selectedTeacher.title} ${selectedTeacher.name}` : null,
    };

    if (editingEntry) {
      const { error } = await supabase
        .from("timetable")
        .update(payload)
        .eq("id", editingEntry.id);

      if (error) {
        toast({ title: "Error updating entry", variant: "destructive" });
      } else {
        toast({ title: "Entry updated" });
        onSuccess();
      }
    } else {
      const { error } = await supabase.from("timetable").insert(payload);

      if (error) {
        toast({ title: "Error creating entry", variant: "destructive" });
      } else {
        toast({ title: "Entry created" });
        onSuccess();
      }
    }

    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Teacher & Subject Selection */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Select Teacher (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TeacherManager
              compact
              onSelect={setSelectedTeacher}
              selectedId={selectedTeacher?.id}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Select Subject *</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SubjectManager
              compact
              onSelect={setSelectedSubject}
              selectedId={selectedSubject?.id}
            />
          </CardContent>
        </Card>
      </div>

      {/* Selected Summary */}
      {(selectedTeacher || selectedSubject) && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm">
            <span className="text-muted-foreground">Selected: </span>
            {selectedSubject && (
              <span className="font-medium">
                {selectedSubject.code} - {selectedSubject.name}
              </span>
            )}
            {selectedTeacher && (
              <span className="text-muted-foreground">
                {" "}
                by {selectedTeacher.title} {selectedTeacher.name}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Conflict Warning */}
      {conflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{conflict}</AlertDescription>
        </Alert>
      )}

      {/* Time & Room Details */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Day</Label>
          <Select
            value={formData.day}
            onValueChange={(value) =>
              setFormData({ ...formData, day: value as (typeof DAYS)[number] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TimePicker
          label="Start Time"
          value={formData.start_time}
          onChange={(value) => setFormData({ ...formData, start_time: value })}
        />

        <TimePicker
          label="End Time"
          value={formData.end_time}
          onChange={(value) => setFormData({ ...formData, end_time: value })}
        />

        <div className="space-y-2">
          <Label>Class Type</Label>
          <Select
            value={formData.class_type}
            onValueChange={(value) =>
              setFormData({ ...formData, class_type: value as "Theory" | "Lab" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Theory">Theory</SelectItem>
              <SelectItem value="Lab">Lab</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Batch</Label>
          <Select
            value={formData.batch}
            onValueChange={(value) =>
              setFormData({ ...formData, batch: value as "B1" | "B2" | "ALL" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Students</SelectItem>
              <SelectItem value="B1">Batch B1 Only</SelectItem>
              <SelectItem value="B2">Batch B2 Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="room_number">Room Number</Label>
        <Input
          id="room_number"
          value={formData.room_number}
          onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
          placeholder="e.g., A101"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !!conflict}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {editingEntry ? "Update Entry" : "Create Entry"}
        </Button>
      </div>
    </form>
  );
}
