import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DAYS = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

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

const initialFormData = {
  day: "Tuesday" as (typeof DAYS)[number],
  time_slot: "",
  course_code: "",
  subject_name: "",
  class_type: "Theory" as "Theory" | "Lab",
  batch: "ALL" as "B1" | "B2" | "ALL",
  room_number: "",
  staff_name: "",
};

export function TimetableManager() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterDay, setFilterDay] = useState<string>("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState(initialFormData);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from("timetable")
      .select("*")
      .order("day", { ascending: true })
      .order("time_slot", { ascending: true });

    if (data) {
      setEntries(data as TimetableEntry[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.day ||
      !formData.time_slot ||
      !formData.course_code ||
      !formData.subject_name ||
      !formData.room_number
    ) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const payload = {
      day: formData.day,
      time_slot: formData.time_slot,
      course_code: formData.course_code,
      subject_name: formData.subject_name,
      class_type: formData.class_type,
      batch: formData.batch,
      room_number: formData.room_number,
      staff_name: formData.staff_name || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("timetable")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error updating entry", variant: "destructive" });
      } else {
        toast({ title: "Entry updated" });
      }
    } else {
      const { error } = await supabase.from("timetable").insert(payload);

      if (error) {
        toast({ title: "Error creating entry", variant: "destructive" });
      } else {
        toast({ title: "Entry created" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    resetForm();
    fetchEntries();
  };

  const handleEdit = (entry: TimetableEntry) => {
    setFormData({
      day: entry.day as (typeof DAYS)[number],
      time_slot: entry.time_slot,
      course_code: entry.course_code,
      subject_name: entry.subject_name,
      class_type: entry.class_type,
      batch: entry.batch,
      room_number: entry.room_number,
      staff_name: entry.staff_name || "",
    });
    setEditingId(entry.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    const { error } = await supabase.from("timetable").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting entry", variant: "destructive" });
    } else {
      toast({ title: "Entry deleted" });
      fetchEntries();
    }
  };

  const filteredEntries =
    filterDay === "all"
      ? entries
      : entries.filter((e) => e.day === filterDay);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Manage Timetable</h2>
          <Badge variant="secondary">{entries.length} entries</Badge>
        </div>
        <div className="flex gap-2">
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary">
                <Plus className="w-4 h-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Entry" : "Add Timetable Entry"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="time_slot">Time Slot</Label>
                    <Input
                      id="time_slot"
                      value={formData.time_slot}
                      onChange={(e) =>
                        setFormData({ ...formData, time_slot: e.target.value })
                      }
                      placeholder="e.g., 09:00 - 10:00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course_code">Course Code</Label>
                    <Input
                      id="course_code"
                      value={formData.course_code}
                      onChange={(e) =>
                        setFormData({ ...formData, course_code: e.target.value })
                      }
                      placeholder="e.g., AI23331"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Class Type</Label>
                    <Select
                      value={formData.class_type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          class_type: value as "Theory" | "Lab",
                        })
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject_name">Subject Name</Label>
                  <Input
                    id="subject_name"
                    value={formData.subject_name}
                    onChange={(e) =>
                      setFormData({ ...formData, subject_name: e.target.value })
                    }
                    placeholder="e.g., Fundamentals of Machine Learning"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Batch</Label>
                    <Select
                      value={formData.batch}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          batch: value as "B1" | "B2" | "ALL",
                        })
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
                  <div className="space-y-2">
                    <Label htmlFor="room_number">Room Number</Label>
                    <Input
                      id="room_number"
                      value={formData.room_number}
                      onChange={(e) =>
                        setFormData({ ...formData, room_number: e.target.value })
                      }
                      placeholder="e.g., A101"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff_name">Staff Name (Optional)</Label>
                  <Input
                    id="staff_name"
                    value={formData.staff_name}
                    onChange={(e) =>
                      setFormData({ ...formData, staff_name: e.target.value })
                    }
                    placeholder="e.g., Mrs. D. Kalpana"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingId ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No timetable entries yet. Add your first one!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="hidden sm:table-cell">Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.day.slice(0, 3)}</TableCell>
                      <TableCell className="text-sm">{entry.time_slot}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.course_code}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {entry.subject_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            entry.class_type === "Theory"
                              ? "border-theory/30 text-theory"
                              : "border-lab/30 text-lab"
                          }
                        >
                          {entry.class_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.batch}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{entry.room_number}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
