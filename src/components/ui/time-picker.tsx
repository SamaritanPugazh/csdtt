import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse current value
  const [currentHour, currentMinute] = value 
    ? value.split(":").map(Number) 
    : [8, 0];

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
  const minutes = [0, 10, 15, 20, 30, 40, 45, 50];

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "Select time";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const handleSelect = (hour: number, minute: number) => {
    onChange(formatTime(hour, minute));
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {formatDisplayTime(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          <div className="p-3">
            <div className="text-sm font-medium mb-2 text-center">Select Time</div>
            <div className="flex gap-2">
              {/* Hours Column */}
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-1">
                <div className="text-xs text-muted-foreground text-center mb-1">Hour</div>
                {hours.map((hour) => {
                  const period = hour >= 12 ? "PM" : "AM";
                  const displayHour = hour > 12 ? hour - 12 : hour;
                  return (
                    <button
                      key={hour}
                      onClick={() => handleSelect(hour, currentMinute || 0)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition-colors",
                        currentHour === hour
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      {displayHour} {period}
                    </button>
                  );
                })}
              </div>
              
              {/* Minutes Column */}
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pl-1 border-l">
                <div className="text-xs text-muted-foreground text-center mb-1">Min</div>
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() => handleSelect(currentHour || 8, minute)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      currentMinute === minute
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    :{minute.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
