import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Search, Filter, X, ChevronDown, ChevronUp, LayoutGrid, List } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TimetableEntryForm } from "./TimetableEntryForm";
import { AdminGridView } from "./AdminGridView";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

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

export function TimetableManager() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const { toast } = useToast();

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

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
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

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    fetchEntries();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesDay = filterDay === "all" || entry.day === filterDay;
    const matchesType = filterType === "all" || entry.class_type === filterType;
    const matchesBatch = filterBatch === "all" || entry.batch === filterBatch;
    const matchesSearch =
      searchQuery === "" ||
      entry.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.staff_name && entry.staff_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDay && matchesType && matchesBatch && matchesSearch;
  });

  const hasActiveFilters =
    filterDay !== "all" || filterType !== "all" || filterBatch !== "all" || searchQuery !== "";

  const clearFilters = () => {
    setFilterDay("all");
    setFilterType("all");
    setFilterBatch("all");
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground animate-pulse">Loading...</div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Add Button and View Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Manage Timetable</h2>
            <Badge variant="secondary" className="transition-all">
              {filteredEntries.length} of {entries.length}
            </Badge>
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
              className="gap-2 transition-all hover:scale-105 active:scale-95"
            >
              {viewMode === "table" ? (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  Grid View
                </>
              ) : (
                <>
                  <List className="w-4 h-4" />
                  Table View
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setEditingEntry(null);
                setIsFormOpen(!isFormOpen);
              }}
              className="gap-2 transition-all hover:scale-105 active:scale-95"
            >
              {isFormOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Close Form
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Entry
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Entry Form */}
        <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
          <CollapsibleContent className="animate-fade-in">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <TimetableEntryForm
                  editingEntry={editingEntry}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                  existingEntries={entries}
                />
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
          <Filter className="w-4 h-4 text-muted-foreground" />

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subject, code, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 transition-all focus:scale-[1.01]"
            />
          </div>

          {/* Day Filter */}
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-[120px] h-9 transition-all hover:border-primary">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day.slice(0, 3)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[110px] h-9 transition-all hover:border-primary">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Theory">Theory</SelectItem>
              <SelectItem value="Lab">Lab</SelectItem>
            </SelectContent>
          </Select>

          {/* Batch Filter */}
          <Select value={filterBatch} onValueChange={setFilterBatch}>
            <SelectTrigger className="w-[100px] h-9 transition-all hover:border-primary">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ALL">ALL</SelectItem>
              <SelectItem value="B1">B1</SelectItem>
              <SelectItem value="B2">B2</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs transition-all hover:scale-105"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* View Content */}
      {filteredEntries.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="py-8 text-center text-muted-foreground">
            {entries.length === 0
              ? "No timetable entries yet. Add your first one!"
              : "No entries match the current filters."}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <AdminGridView 
          entries={filteredEntries} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      ) : (
        <Card className="animate-fade-in overflow-hidden">
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
                  {filteredEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "transition-all duration-200 hover:bg-muted/50 animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <TableCell className="font-medium">{entry.day.slice(0, 3)}</TableCell>
                      <TableCell className="text-sm">{entry.time_slot}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.course_code}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {entry.subject_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "transition-all",
                            entry.class_type === "Theory"
                              ? "border-theory/30 text-theory"
                              : "border-lab/30 text-lab"
                          )}
                        >
                          {entry.class_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="transition-all">
                          {entry.batch}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{entry.room_number}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            className="transition-all hover:scale-110 hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive transition-all hover:scale-110"
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
