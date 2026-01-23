import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Loader2, Timer, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  display_duration: number | null;
}

type FilterStatus = "all" | "active" | "inactive";

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_active: true,
    display_duration: null as number | null,
  });

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setAnnouncements(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({ title: "", content: "", is_active: true, display_duration: null });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("announcements")
        .update(formData)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error updating announcement", variant: "destructive" });
      } else {
        toast({ title: "Announcement updated" });
      }
    } else {
      const { error } = await supabase.from("announcements").insert(formData);

      if (error) {
        toast({ title: "Error creating announcement", variant: "destructive" });
      } else {
        toast({ title: "Announcement created" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    resetForm();
    fetchAnnouncements();
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active,
      display_duration: announcement.display_duration,
    });
    setEditingId(announcement.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting announcement", variant: "destructive" });
    } else {
      toast({ title: "Announcement deleted" });
      fetchAnnouncements();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      fetchAnnouncements();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  // Filter announcements based on status
  const filteredAnnouncements = announcements.filter((a) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return a.is_active;
    return !a.is_active;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Manage Announcements</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAnnouncements.length} of {announcements.length} announcements
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filter Dropdown */}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[130px] transition-all hover:border-primary">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
              <Button className="gap-2 gradient-primary transition-all hover:scale-105 active:scale-95">
                <Plus className="w-4 h-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="animate-scale-in">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Announcement" : "Create Announcement"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="transition-all focus:scale-[1.01]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={4}
                    className="transition-all focus:scale-[1.01]"
                  />
                </div>
                
                {/* Display Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Auto-dismiss after (seconds)
                  </Label>
                  <Select 
                    value={formData.display_duration?.toString() || "none"}
                    onValueChange={(v) => setFormData({ 
                      ...formData, 
                      display_duration: v === "none" ? null : parseInt(v) 
                    })}
                  >
                    <SelectTrigger className="transition-all hover:border-primary">
                      <SelectValue placeholder="No auto-dismiss" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No auto-dismiss</SelectItem>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Set a duration to auto-hide the announcement after the specified time
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
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
                    className="transition-all hover:scale-105 active:scale-95"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="transition-all hover:scale-105 active:scale-95">
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

      {filteredAnnouncements.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="py-8 text-center text-muted-foreground">
            {announcements.length === 0 
              ? "No announcements yet. Create your first one!"
              : "No announcements match the current filter."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements.map((announcement, index) => (
            <Card 
              key={announcement.id}
              className={cn(
                "transition-all duration-300 hover:shadow-md animate-fade-in",
                "hover:-translate-y-0.5"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={announcement.is_active ? "default" : "secondary"}
                        className={cn(
                          "transition-all",
                          announcement.is_active
                            ? "bg-success text-success-foreground"
                            : ""
                        )}
                      >
                        {announcement.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {announcement.display_duration && (
                        <Badge variant="outline" className="gap-1">
                          <Timer className="w-3 h-3" />
                          {announcement.display_duration}s
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleActive(announcement.id, announcement.is_active)
                      }
                      className="transition-all hover:scale-110"
                    >
                      <Switch checked={announcement.is_active} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(announcement)}
                      className="transition-all hover:scale-110 hover:text-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive transition-all hover:scale-110"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
