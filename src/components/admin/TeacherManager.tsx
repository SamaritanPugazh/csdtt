import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Loader2, Search, User } from "lucide-react";
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
import { cn } from "@/lib/utils";

const TITLES = ["Mr.", "Mrs.", "Ms.", "Dr."] as const;

interface Teacher {
  id: string;
  title: string;
  name: string;
  department: string | null;
  status: string;
  created_at: string;
}

const initialFormData = {
  title: "Mr." as (typeof TITLES)[number],
  name: "",
  department: "",
  status: "active" as "active" | "inactive",
};

interface TeacherManagerProps {
  onSelect?: (teacher: Teacher) => void;
  selectedId?: string;
  compact?: boolean;
}

export function TeacherManager({ onSelect, selectedId, compact = false }: TeacherManagerProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState(initialFormData);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from("teachers")
      .select("*")
      .order("name", { ascending: true });

    if (data) {
      setTeachers(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Teacher name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const payload = {
      title: formData.title,
      name: formData.name.trim(),
      department: formData.department.trim() || null,
      status: formData.status,
    };

    if (editingId) {
      const { error } = await supabase
        .from("teachers")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error updating teacher", variant: "destructive" });
      } else {
        toast({ title: "Teacher updated" });
      }
    } else {
      const { error } = await supabase.from("teachers").insert(payload);

      if (error) {
        toast({ title: "Error creating teacher", variant: "destructive" });
      } else {
        toast({ title: "Teacher added" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    resetForm();
    fetchTeachers();
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      title: teacher.title as (typeof TITLES)[number],
      name: teacher.name,
      department: teacher.department || "",
      status: teacher.status as "active" | "inactive",
    });
    setEditingId(teacher.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;

    const { error } = await supabase.from("teachers").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting teacher", variant: "destructive" });
    } else {
      toast({ title: "Teacher deleted" });
      fetchTeachers();
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      searchQuery === "" ||
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.department && teacher.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "all" || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Teachers</h3>
          <Badge variant="secondary">{filteredTeachers.length}</Badge>
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
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Select
                    value={formData.title}
                    onValueChange={(value) =>
                      setFormData({ ...formData, title: value as (typeof TITLES)[number] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TITLES.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., D. Kalpana"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as "active" | "inactive" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[100px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teacher List */}
      <div className={cn("space-y-2 max-h-[300px] overflow-y-auto", compact && "max-h-[200px]")}>
        {filteredTeachers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">No teachers found</p>
        ) : (
          filteredTeachers.map((teacher, index) => (
            <div
              key={teacher.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer animate-fade-in",
                selectedId === teacher.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50",
                teacher.status === "inactive" && "opacity-60"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => onSelect?.(teacher)}
            >
              <div>
                <p className="font-medium text-sm">
                  {teacher.title} {teacher.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{teacher.id.slice(0, 8)}</span>
                  {teacher.department && (
                    <span>• {teacher.department}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant={teacher.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {teacher.status}
                </Badge>
                {!compact && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(teacher);
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
                        handleDelete(teacher.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
