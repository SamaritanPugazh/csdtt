import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useStudent, BATCH_CONFIGURABLE_COURSES } from "@/hooks/useStudent";
import { supabase } from "@/integrations/supabase/client";
import { CalendarView } from "@/components/timetable/CalendarView";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, FlaskConical } from "lucide-react";

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

export default function Dashboard() {
  const { student, isLoading: studentLoading, getSubjectBatch } = useStudent();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentLoading && !student?.rollNumber) {
      navigate("/entry");
    }
  }, [student, studentLoading, navigate]);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!student?.rollNumber) return;

      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .order("time_slot", { ascending: true });

      if (data && !error) {
        setTimetable(data as TimetableEntry[]);
      }
      setIsLoading(false);
    };

    if (student?.rollNumber) {
      fetchTimetable();
    }
  }, [student?.rollNumber]);

  // Filter timetable based on per-subject batch preferences
  const getFilteredTimetable = () => {
    return timetable.filter((entry) => {
      // Show all theory classes
      if (entry.class_type === "Theory") return true;
      // Show labs that are for ALL batches
      if (entry.batch === "ALL") return true;
      
      // For batch-configurable courses, use the student's preference
      if (BATCH_CONFIGURABLE_COURSES.includes(entry.course_code)) {
        const preferredBatch = getSubjectBatch(entry.course_code);
        return entry.batch === preferredBatch;
      }
      
      // For other labs, show all (or use default batch)
      return true;
    });
  };

  if (studentLoading || !student?.rollNumber) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  const filteredTimetable = getFilteredTimetable();
  const theoryCount = filteredTimetable.filter((e) => e.class_type === "Theory").length;
  const labCount = filteredTimetable.filter((e) => e.class_type === "Lab").length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-space font-bold text-foreground mb-2">
            Your Timetable
          </h1>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {student.rollNumber}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <BookOpen className="w-3 h-3" />
              {theoryCount} Theory
            </Badge>
            <Badge variant="outline" className="gap-1">
              <FlaskConical className="w-3 h-3" />
              {labCount} Labs
            </Badge>
          </div>
        </div>

        {/* Announcements */}
        <AnnouncementBanner />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-card rounded-xl border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-theory" />
            <span className="text-sm text-muted-foreground">Theory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-lab" />
            <span className="text-sm text-muted-foreground">Lab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted border-2 border-dashed border-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">Holiday</span>
          </div>
        </div>

        {/* Calendar Timetable View */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        ) : (
          <CalendarView entries={filteredTimetable} />
        )}
      </div>
    </Layout>
  );
}
