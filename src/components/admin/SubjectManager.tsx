import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Loader2, Search, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string | null;
  credit_hours: number | null;
  created_at: string;
}

const initialFormData = {
  code: "",
  name: "",
  department: "",
  credit_hours: "",
};

interface SubjectManagerProps {
  onSelect?: (subject: Subject) => void;
  selectedId?: string;
  compact?: boolean;
}

export function SubjectManager({ onSelect, selectedId, compact = false }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState(initialFormData);

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .order("code", { ascending: true });

    if (data) {
      setSubjects(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Subject code and name are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      department: formData.department.trim() || null,
      credit_hours: formData.credit_hours ? parseInt(formData.credit_hours) : null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("subjects")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error updating subject", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Subject updated" });
      }
    } else {
      const { error } = await supabase.from("subjects").insert(payload);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Subject code already exists", variant: "destructive" });
        } else {
          toast({ title: "Error creating subject", variant: "destructive" });
        }
      } else {
        toast({ title: "Subject added" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    resetForm();
    fetchSubjects();
  };

  const handleEdit = (subject: Subject) => {
    setFormData({
      code: subject.code,
      name: subject.name,
      department: subject.department || "",
      credit_hours: subject.credit_hours?.toString() || "",
    });
    setEditingId(subject.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    const { error } = await supabase.from("subjects").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting subject", variant: "destructive" });
    } else {
      toast({ title: "Subject deleted" });
      fetchSubjects();
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      searchQuery === "" ||
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Subjects</h3>
          <Badge variant="secondary">{filteredSubjects.length}</Badge>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 transition-all hover:scale-105">
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Subject" : "Add Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., AI23331"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_hours">Credit Hours</Label>
                  <Input
                    id="credit_hours"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credit_hours}
                    onChange={(e) => setFormData({ ...formData, credit_hours: e.target.value })}
                    placeholder="e.g., 3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fundamentals of Machine Learning"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Computer Science"
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by code or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Subject List */}
      <div className={cn("space-y-2 max-h-[300px] overflow-y-auto", compact && "max-h-[200px]")}>
        {filteredSubjects.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">No subjects found</p>
        ) : (
          filteredSubjects.map((subject, index) => (
            <div
              key={subject.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer animate-fade-in",
                selectedId === subject.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => onSelect?.(subject)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {subject.code}
                  </Badge>
                  {subject.credit_hours && (
                    <span className="text-xs text-muted-foreground">{subject.credit_hours} hrs</span>
                  )}
                </div>
                <p className="font-medium text-sm mt-1">{subject.name}</p>
                {subject.department && (
                  <p className="text-xs text-muted-foreground">{subject.department}</p>
                )}
              </div>
              {!compact && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(subject);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(subject.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
