import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DaySchedule } from "@/components/timetable/DaySchedule";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, FlaskConical } from "lucide-react";

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

export default function Dashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>(getCurrentDay());

  function getCurrentDay(): string {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    if (DAYS.includes(today as (typeof DAYS)[number])) {
      return today;
    }
    return "Tuesday";
  }

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!profile) return;

      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .order("time_slot", { ascending: true });

      if (data && !error) {
        // Filter based on user's batch
        const filteredData = data.filter((entry) => {
          // Show all theory classes
          if (entry.class_type === "Theory") return true;
          // Show labs that are for ALL batches
          if (entry.batch === "ALL") return true;
          // Show labs that match user's batch
          return entry.batch === profile.batch;
        });
        setTimetable(filteredData as TimetableEntry[]);
      }
      setIsLoading(false);
    };

    if (profile) {
      fetchTimetable();
    }
  }, [profile]);

  if (authLoading || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  const getEntriesForDay = (day: string) => {
    return timetable.filter((entry) => entry.day === day);
  };

  const theoryCount = timetable.filter((e) => e.class_type === "Theory").length;
  const labCount = timetable.filter((e) => e.class_type === "Lab").length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-space font-bold text-foreground mb-2">
            Welcome, <span className="text-gradient">{profile.name.split(" ")[0]}</span>!
          </h1>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {profile.roll_number}
            </Badge>
            <Badge variant="secondary">Batch {profile.batch}</Badge>
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
          <div className="text-sm text-muted-foreground ml-auto">
            <span className="font-medium text-foreground">Sun & Mon:</span> Holidays
          </div>
        </div>

        {/* Timetable Tabs */}
        <Tabs value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="w-full flex overflow-x-auto mb-6 h-auto p-1">
            {DAYS.map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className="flex-1 min-w-[80px] data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            DAYS.map((day) => (
              <TabsContent key={day} value={day} className="mt-0">
                <DaySchedule day={day} entries={getEntriesForDay(day)} />
              </TabsContent>
            ))
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
