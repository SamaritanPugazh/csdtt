import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Loader2, FileText, BookOpen, Upload } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface CourseUnit {
  id: string;
  subject_id: string;
  unit_number: number;
  unit_name: string;
  syllabus: string | null;
}

const initialFormData = {
  subject_id: "",
  unit_number: "1",
  unit_name: "",
  syllabus: "",
};

export function CourseUnitsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState(initialFormData);

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, code, name")
      .order("code", { ascending: true });

    if (data) {
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].id);
      }
    }
  };

  const fetchUnits = async () => {
    if (!selectedSubject) return;

    const { data } = await supabase
      .from("course_units")
      .select("*")
      .eq("subject_id", selectedSubject)
      .order("unit_number", { ascending: true });

    if (data) {
      setUnits(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      setIsLoading(true);
      fetchUnits();
    }
  }, [selectedSubject]);

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      subject_id: selectedSubject,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_name.trim()) {
      toast({
        title: "Validation error",
        description: "Unit name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const payload = {
      subject_id: selectedSubject,
      unit_number: parseInt(formData.unit_number),
      unit_name: formData.unit_name.trim(),
      syllabus: formData.syllabus.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("course_units")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error updating unit", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Unit updated" });
      }
    } else {
      const { error } = await supabase.from("course_units").insert(payload);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "This unit number already exists for this subject", variant: "destructive" });
        } else {
          toast({ title: "Error creating unit", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Unit added" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    resetForm();
    fetchUnits();
  };

  const handleEdit = (unit: CourseUnit) => {
    setFormData({
      subject_id: unit.subject_id,
      unit_number: unit.unit_number.toString(),
      unit_name: unit.unit_name,
      syllabus: unit.syllabus || "",
    });
    setEditingId(unit.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;

    const { error } = await supabase.from("course_units").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting unit", variant: "destructive" });
    } else {
      toast({ title: "Unit deleted" });
      fetchUnits();
    }
  };

  const handleJsonImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      if (!parsed.units || !Array.isArray(parsed.units)) {
        toast({ title: "Invalid JSON", description: "JSON must contain a 'units' array", variant: "destructive" });
        return;
      }

      // Find or match subject
      let subjectId = selectedSubject;
      if (parsed.course?.course_code) {
        const match = subjects.find(s => s.code === parsed.course.course_code);
        if (match) {
          subjectId = match.id;
          setSelectedSubject(match.id);
        }
      }

      if (!subjectId) {
        toast({ title: "No subject selected", variant: "destructive" });
        return;
      }

      setIsSaving(true);

      // Delete existing units for this subject first
      await supabase.from("course_units").delete().eq("subject_id", subjectId);

      // Insert new units
      const inserts = parsed.units.map((unit: any, index: number) => ({
        subject_id: subjectId,
        unit_number: index + 1,
        unit_name: unit.unit_title || `Unit ${index + 1}`,
        syllabus: Array.isArray(unit.topics) ? unit.topics.join(", ") : (unit.topics || null),
      }));

      const { error } = await supabase.from("course_units").insert(inserts);

      if (error) {
        toast({ title: "Error importing", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Syllabus imported successfully", description: `${inserts.length} units imported` });
        setIsJsonDialogOpen(false);
        setJsonInput("");
        fetchUnits();
      }

      setIsSaving(false);
    } catch {
      toast({ title: "Invalid JSON format", description: "Please check your JSON syntax", variant: "destructive" });
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  const jsonTemplate = JSON.stringify({
    course: { course_name: "", course_code: "" },
    units: [
      { unit_number: "UNIT-I", unit_title: "", hours: 0, topics: [] },
      { unit_number: "UNIT-II", unit_title: "", hours: 0, topics: [] },
      { unit_number: "UNIT-III", unit_title: "", hours: 0, topics: [] },
      { unit_number: "UNIT-IV", unit_title: "", hours: 0, topics: [] },
      { unit_number: "UNIT-V", unit_title: "", hours: 0, topics: [] },
    ],
  }, null, 2);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-wrap gap-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Course Syllabus
        </CardTitle>
        <div className="flex gap-2">
          {/* JSON Import Button */}
          <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1" disabled={!selectedSubject}>
                <Upload className="w-4 h-4" />
                Import JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Syllabus from JSON</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Paste your syllabus JSON below. This will replace all existing units for <strong>{currentSubject?.name || "the selected subject"}</strong>.
                </p>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={jsonTemplate}
                  rows={12}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setJsonInput(jsonTemplate); }}>
                    Load Template
                  </Button>
                  <Button onClick={handleJsonImport} disabled={isSaving || !jsonInput.trim()}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Import
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Unit Button */}
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" disabled={!selectedSubject}>
                <Plus className="w-4 h-4" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="animate-scale-in max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Unit" : "Add Unit"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_number">Unit Number</Label>
                    <Select
                      value={formData.unit_number}
                      onValueChange={(value) => setFormData({ ...formData, unit_number: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Unit {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <p className="text-sm text-muted-foreground pt-2">
                      {currentSubject?.code} - {currentSubject?.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_name">Unit Name</Label>
                  <Input
                    id="unit_name"
                    value={formData.unit_name}
                    onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                    placeholder="e.g., Introduction to Neural Networks"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syllabus">Syllabus Content</Label>
                  <Textarea
                    id="syllabus"
                    value={formData.syllabus}
                    onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                    placeholder="Enter the syllabus topics and content for this unit..."
                    rows={5}
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
                    {editingId ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject Selector */}
        <div className="space-y-2">
          <Label>Select Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-mono text-xs">{subject.code}</span>
                    <span>-</span>
                    <span>{subject.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Units List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">Loading units...</div>
        ) : units.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No units added yet for this subject.</p>
            <p className="text-sm">Click "Add Unit" or "Import JSON" to create syllabus content.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {units.map((unit) => (
              <AccordionItem key={unit.id} value={unit.id}>
                <AccordionTrigger className="hover:no-underline group">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Unit {unit.unit_number}</Badge>
                      <span className="text-left font-medium">{unit.unit_name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(unit);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(unit.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {unit.syllabus ? (
                    <div className="pl-4 pt-2">
                      <p className="text-muted-foreground whitespace-pre-wrap">{unit.syllabus}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic pl-4 pt-2">
                      No syllabus content added yet.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
