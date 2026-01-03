import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, BookOpen, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TimetableCardProps {
  entry: TimetableEntry;
  index: number;
}

export function TimetableCard({ entry, index }: TimetableCardProps) {
  const isTheory = entry.class_type === "Theory";

  return (
    <Card
      className={cn(
        "card-hover border-l-4 animate-fade-in",
        isTheory ? "border-l-theory bg-theory-light/30" : "border-l-lab bg-lab-light/30"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isTheory ? "bg-theory/10" : "bg-lab/10"
              )}
            >
              {isTheory ? (
                <BookOpen className={cn("w-4 h-4", "text-theory")} />
              ) : (
                <FlaskConical className={cn("w-4 h-4", "text-lab")} />
              )}
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "font-mono text-xs",
                isTheory
                  ? "bg-theory/10 text-theory hover:bg-theory/20"
                  : "bg-lab/10 text-lab hover:bg-lab/20"
              )}
            >
              {entry.course_code}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isTheory ? "border-theory/30 text-theory" : "border-lab/30 text-lab"
              )}
            >
              {entry.class_type}
            </Badge>
            {entry.batch !== "ALL" && (
              <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                {entry.batch}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-3 line-clamp-2">
          {entry.subject_name}
        </h3>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{entry.time_slot}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{entry.room_number}</span>
          </div>
          {entry.staff_name && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>{entry.staff_name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
