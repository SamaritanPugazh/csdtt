import { TimetableCard } from "./TimetableCard";
import { Calendar, PartyPopper } from "lucide-react";

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

interface DayScheduleProps {
  day: string;
  entries: TimetableEntry[];
  isHoliday?: boolean;
}

// Parse time string like "9:00" or "10:30" to minutes for proper sorting
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map((s) => parseInt(s.trim(), 10));
  return hours * 60 + (minutes || 0);
}

export function DaySchedule({ day, entries, isHoliday = false }: DayScheduleProps) {
  // Sort entries by time slot (earliest to latest)
  const sortedEntries = [...entries].sort((a, b) => {
    const timeA = a.time_slot.split("-")[0].trim();
    const timeB = b.time_slot.split("-")[0].trim();
    return parseTimeToMinutes(timeA) - parseTimeToMinutes(timeB);
  });

  if (isHoliday) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <PartyPopper className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-space font-bold text-xl text-foreground">{day}</h2>
            <p className="text-sm text-muted-foreground">Holiday</p>
          </div>
        </div>
        <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/20">
          <PartyPopper className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">No Classes</p>
          <p className="text-sm text-muted-foreground/70">Enjoy your holiday!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-space font-bold text-xl text-foreground">{day}</h2>
          <p className="text-sm text-muted-foreground">
            {sortedEntries.length} {sortedEntries.length === 1 ? "class" : "classes"}
          </p>
        </div>
      </div>

      {sortedEntries.length > 0 ? (
        <div className="grid gap-3">
          {sortedEntries.map((entry, index) => (
            <TimetableCard key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
          <p>No classes scheduled</p>
        </div>
      )}
    </div>
  );
}
