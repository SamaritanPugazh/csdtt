import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, BookOpen, FlaskConical, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TodaySummaryProps {
  entries: TimetableEntry[];
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TodaySummary({ entries }: TodaySummaryProps) {
  const todayClasses = useMemo(() => {
    const today = DAYS[new Date().getDay()];
    return entries
      .filter((entry) => entry.day === today)
      .sort((a, b) => {
        const timeA = a.time_slot.split(" - ")[0];
        const timeB = b.time_slot.split(" - ")[0];
        return timeA.localeCompare(timeB);
      });
  }, [entries]);

  const today = DAYS[new Date().getDay()];
  const isHoliday = today === "Sunday" || today === "Monday";

  if (isHoliday) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-accent/30 to-accent/10 border-accent/20 animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-2xl font-semibold text-primary mb-1">🎉 No Classes Today!</p>
            <p className="text-muted-foreground text-sm">Enjoy your {today}!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todayClasses.length === 0) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-muted/50 to-muted/20 border-muted animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Today's Summary — {today}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No classes scheduled for today</p>
        </CardContent>
      </Card>
    );
  }

  const theoryCount = todayClasses.filter((e) => e.class_type === "Theory").length;
  const labCount = todayClasses.filter((e) => e.class_type === "Lab").length;

  return (
    <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/0 border-primary/20 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Today's Summary — {today}
          </CardTitle>
          <div className="flex gap-2">
            {theoryCount > 0 && (
              <Badge variant="outline" className="gap-1 border-theory/30 text-theory">
                <BookOpen className="w-3 h-3" />
                {theoryCount} Theory
              </Badge>
            )}
            {labCount > 0 && (
              <Badge variant="outline" className="gap-1 border-lab/30 text-lab">
                <FlaskConical className="w-3 h-3" />
                {labCount} Lab
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {todayClasses.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "flex flex-wrap items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm animate-fade-in",
                entry.class_type === "Theory"
                  ? "bg-theory/5 border-theory/20"
                  : "bg-lab/5 border-lab/20"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-2 min-w-[100px]">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{entry.time_slot}</span>
              </div>
              
              <div className="flex-1 min-w-[150px]">
                <p className="font-medium text-sm">{entry.subject_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{entry.course_code}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    entry.class_type === "Theory"
                      ? "border-theory/30 text-theory"
                      : "border-lab/30 text-lab"
                  )}
                >
                  {entry.class_type}
                </Badge>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {entry.room_number}
                </div>

                {entry.staff_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    {entry.staff_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
