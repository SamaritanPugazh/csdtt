import { cn } from "@/lib/utils";
import { CalendarClassBlock } from "@/components/timetable/CalendarClassBlock";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const START_HOUR = 8;
const END_HOUR = 17;
const HOUR_HEIGHT = 70;

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

interface AdminGridViewProps {
  entries: TimetableEntry[];
  onEdit: (entry: TimetableEntry) => void;
  onDelete: (id: string) => void;
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function AdminGridView({ entries, onEdit, onDelete }: AdminGridViewProps) {
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const getBlockStyle = (timeSlot: string) => {
    const parts = timeSlot.includes(" - ") ? timeSlot.split(" - ") : timeSlot.split("-");
    const startTime = parts[0]?.trim() || "8:00";
    const endTime = parts[1]?.trim() || "9:00";
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    const startFromBase = startMinutes - START_HOUR * 60;
    const duration = endMinutes - startMinutes;
    
    const top = (startFromBase / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height: Math.max(height, 50) };
  };

  const getEntriesForDay = (day: string) => {
    return entries.filter(entry => entry.day === day);
  };

  const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
    const hour = START_HOUR + i;
    return hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
  });

  return (
    <div className="bg-card rounded-xl border overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b">
        <div className="flex">
          <div className="w-16 flex-shrink-0 border-r" />
          {DAYS.map((day, index) => {
            const isToday = day === currentDay;
            return (
              <div
                key={day}
                className={cn(
                  "flex-1 text-center py-3 border-r last:border-r-0 transition-all duration-300",
                  isToday && "bg-primary/10"
                )}
              >
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isToday && "text-primary font-semibold"
                )}>
                  {SHORT_DAYS[index]}
                </span>
                {isToday && (
                  <div className="w-2 h-2 rounded-full bg-primary mx-auto mt-1 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex overflow-x-auto">
        {/* Time Labels */}
        <div className="w-16 flex-shrink-0 border-r bg-muted/20">
          {timeSlots.map((time, index) => (
            <div 
              key={time} 
              className="text-xs text-muted-foreground px-2 text-right flex items-start pt-1 animate-fade-in"
              style={{ height: HOUR_HEIGHT, animationDelay: `${index * 20}ms` }}
            >
              {time.replace(':00', '')}
            </div>
          ))}
        </div>
        
        {/* Day Columns */}
        {DAYS.map((day, dayIndex) => {
          const isToday = day === currentDay;
          const dayEntries = getEntriesForDay(day);
          
          return (
            <div
              key={day}
              className={cn(
                "flex-1 min-w-[120px] relative border-r last:border-r-0 transition-colors duration-300",
                isToday && "bg-primary/5 ring-1 ring-inset ring-primary/20"
              )}
            >
              {/* Grid Lines */}
              {timeSlots.map((_, index) => (
                <div 
                  key={index}
                  className="border-b border-muted-foreground/10"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
              
              {/* Class Blocks */}
              <div className="absolute inset-0 p-1">
                {dayEntries.map((entry, entryIndex) => {
                  const { top, height } = getBlockStyle(entry.time_slot);
                  return (
                    <div
                      key={entry.id}
                      className="absolute left-1 right-1 animate-scale-in group"
                      style={{ 
                        top, 
                        height,
                        animationDelay: `${(dayIndex * 50) + (entryIndex * 30)}ms`
                      }}
                    >
                      <div className="relative h-full">
                        <CalendarClassBlock entry={entry} compact={height < 60} />
                        {/* Hover Actions */}
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 p-0.5 bg-background/80 rounded-bl-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => onEdit(entry)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive"
                            onClick={() => onDelete(entry.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
