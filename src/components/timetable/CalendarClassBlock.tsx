import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, FlaskConical, MapPin, Clock, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TimetableEntry {
  id: string;
  time_slot: string;
  course_code: string;
  subject_name: string;
  class_type: "Theory" | "Lab";
  batch: "B1" | "B2" | "ALL";
  room_number: string;
  staff_name?: string;
}

interface CalendarClassBlockProps {
  entry: TimetableEntry;
  compact?: boolean;
}

export function CalendarClassBlock({ entry, compact = false }: CalendarClassBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isTheory = entry.class_type === "Theory";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full h-full rounded-lg p-1.5 text-left transition-all overflow-hidden",
          "hover:scale-[1.02] hover:shadow-lg hover:z-10 relative",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          isTheory 
            ? "bg-theory/90 text-theory-foreground hover:bg-theory focus:ring-theory/50" 
            : "bg-lab/90 text-lab-foreground hover:bg-lab focus:ring-lab/50",
          "shadow-md"
        )}
      >
        <div className="flex flex-col h-full">
          {compact ? (
            // Compact view for short time slots
            <div className="flex items-center gap-1 min-w-0">
              {isTheory ? (
                <BookOpen className="w-3 h-3 flex-shrink-0 opacity-80" />
              ) : (
                <FlaskConical className="w-3 h-3 flex-shrink-0 opacity-80" />
              )}
              <span className="text-[10px] font-medium truncate">{entry.course_code}</span>
            </div>
          ) : (
            // Full view
            <>
              <div className="flex items-center gap-1 mb-0.5">
                {isTheory ? (
                  <BookOpen className="w-3 h-3 flex-shrink-0 opacity-80" />
                ) : (
                  <FlaskConical className="w-3 h-3 flex-shrink-0 opacity-80" />
                )}
                <span className="text-[10px] font-bold opacity-90">{entry.course_code}</span>
                {entry.batch !== "ALL" && (
                  <span className="text-[9px] font-medium opacity-70 ml-auto">
                    {entry.batch}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium leading-tight line-clamp-2 flex-1">
                {entry.subject_name}
              </p>
              <div className="flex items-center gap-1 mt-auto opacity-80">
                <MapPin className="w-2.5 h-2.5" />
                <span className="text-[9px]">{entry.room_number}</span>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Detail Dialog for Mobile Tap */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isTheory ? "bg-theory/20" : "bg-lab/20"
                )}
              >
                {isTheory ? (
                  <BookOpen className={cn("w-4 h-4", "text-theory")} />
                ) : (
                  <FlaskConical className={cn("w-4 h-4", "text-lab")} />
                )}
              </div>
              <span>{entry.subject_name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "font-mono",
                  isTheory
                    ? "bg-theory/10 text-theory"
                    : "bg-lab/10 text-lab"
                )}
              >
                {entry.course_code}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  isTheory ? "border-theory/30 text-theory" : "border-lab/30 text-lab"
                )}
              >
                {entry.class_type}
              </Badge>
              {entry.batch !== "ALL" && (
                <Badge variant="outline" className="border-accent/30 text-accent">
                  Batch {entry.batch}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-4 h-4 text-foreground/70" />
                <span>{entry.time_slot}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 text-foreground/70" />
                <span>{entry.room_number}</span>
              </div>
              {entry.staff_name && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <User className="w-4 h-4 text-foreground/70" />
                  <span>{entry.staff_name}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
