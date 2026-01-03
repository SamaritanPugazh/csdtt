import { TimetableCard } from "./TimetableCard";
import { Calendar } from "lucide-react";

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
}

export function DaySchedule({ day, entries }: DayScheduleProps) {
  // Sort entries by time slot
  const sortedEntries = [...entries].sort((a, b) => {
    const timeA = a.time_slot.split("-")[0].trim();
    const timeB = b.time_slot.split("-")[0].trim();
    return timeA.localeCompare(timeB);
  });

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
