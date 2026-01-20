import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarClassBlock } from "./CalendarClassBlock";
import { useIsMobile } from "@/hooks/use-mobile";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HOLIDAYS = ["Sunday", "Monday"] as const;

// Time slots from 8 AM to 5 PM (in hours)
const START_HOUR = 8;
const END_HOUR = 17;
const HOUR_HEIGHT = 60; // pixels per hour

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

interface CalendarViewProps {
  entries: TimetableEntry[];
}

// Parse time string like "8:00" or "13:20" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Get current week date range string
function getWeekRangeString(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const formatDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`;
}

export function CalendarView({ entries }: CalendarViewProps) {
  const isMobile = useIsMobile();
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  
  // Handle swipe gestures on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedDayIndex < 6) {
        setSelectedDayIndex(prev => prev + 1);
      } else if (diff < 0 && selectedDayIndex > 0) {
        setSelectedDayIndex(prev => prev - 1);
      }
    }
  };
  
  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedDayIndex > 0) {
      setSelectedDayIndex(prev => prev - 1);
    } else if (direction === 'next' && selectedDayIndex < 6) {
      setSelectedDayIndex(prev => prev + 1);
    }
  };

  // Calculate position and height for a class block
  const getBlockStyle = (timeSlot: string) => {
    const [startTime, endTime] = timeSlot.split(" - ");
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    const startFromBase = startMinutes - START_HOUR * 60;
    const duration = endMinutes - startMinutes;
    
    const top = (startFromBase / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height: Math.max(height, 40) }; // Minimum height of 40px
  };

  // Get entries for a specific day
  const getEntriesForDay = (day: string) => {
    return entries.filter(entry => entry.day === day);
  };

  // Time slot labels
  const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
    const hour = START_HOUR + i;
    return hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
  });

  // Mobile single-day view
  if (isMobile) {
    const selectedDay = DAYS[selectedDayIndex];
    const isHoliday = HOLIDAYS.includes(selectedDay as typeof HOLIDAYS[number]);
    const dayEntries = getEntriesForDay(selectedDay);

    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b p-4">
          <p className="text-xs text-muted-foreground text-center mb-2">{getWeekRangeString()}</p>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigateDay('prev')}
              disabled={selectedDayIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h3 className={cn(
                "font-semibold text-lg",
                selectedDay === currentDay && "text-primary"
              )}>
                {selectedDay}
              </h3>
              {selectedDay === currentDay && (
                <span className="text-xs text-primary">Today</span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigateDay('next')}
              disabled={selectedDayIndex === 6}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Day pills for quick navigation */}
          <div className="flex gap-1 mt-3 justify-center">
            {SHORT_DAYS.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDayIndex(index)}
                className={cn(
                  "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                  index === selectedDayIndex 
                    ? "bg-primary text-primary-foreground" 
                    : HOLIDAYS.includes(DAYS[index] as typeof HOLIDAYS[number])
                      ? "bg-muted text-muted-foreground"
                      : DAYS[index] === currentDay
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {day[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid - Mobile */}
        <div 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isHoliday ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <span className="text-4xl mb-3">🎉</span>
              <span className="text-lg font-medium">Holiday</span>
              <span className="text-sm">No classes scheduled</span>
            </div>
          ) : (
            <div className="flex">
              {/* Time Labels */}
              <div className="w-14 flex-shrink-0 border-r bg-muted/20">
                {timeSlots.map((time, index) => (
                  <div 
                    key={time} 
                    className="text-xs text-muted-foreground pr-2 text-right"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {time.replace(':00', '')}
                  </div>
                ))}
              </div>
              
              {/* Day Column */}
              <div className="flex-1 relative">
                {/* Grid Lines */}
                {timeSlots.map((_, index) => (
                  <div 
                    key={index}
                    className="border-b border-dashed border-muted-foreground/10"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                
                {/* Class Blocks */}
                <div className="absolute inset-0 p-1">
                  {dayEntries.map((entry) => {
                    const { top, height } = getBlockStyle(entry.time_slot);
                    return (
                      <div
                        key={entry.id}
                        className="absolute left-1 right-1"
                        style={{ top, height }}
                      >
                        <CalendarClassBlock entry={entry} compact={height < 60} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop full week view
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b">
        <div className="text-center py-2 border-b bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">{getWeekRangeString()}</span>
        </div>
        <div className="flex">
          {/* Empty corner for time labels */}
          <div className="w-16 flex-shrink-0 border-r" />
          
          {/* Day Headers */}
          {DAYS.map((day) => {
            const isHoliday = HOLIDAYS.includes(day as typeof HOLIDAYS[number]);
            const isToday = day === currentDay;
            
            return (
              <div
                key={day}
                className={cn(
                  "flex-1 text-center py-3 border-r last:border-r-0 transition-colors",
                  isHoliday && "bg-muted/50",
                  isToday && "bg-primary/10"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isHoliday && "text-muted-foreground",
                  isToday && "text-primary"
                )}>
                  {day.slice(0, 3)}
                </span>
                {isToday && (
                  <div className="w-2 h-2 rounded-full bg-primary mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid - Desktop */}
      <div className="flex overflow-x-auto" ref={scrollRef}>
        {/* Time Labels */}
        <div className="w-16 flex-shrink-0 border-r bg-muted/20">
          {timeSlots.map((time) => (
            <div 
              key={time} 
              className="text-xs text-muted-foreground px-2 text-right flex items-start pt-1"
              style={{ height: HOUR_HEIGHT }}
            >
              {time.replace(':00', '')}
            </div>
          ))}
        </div>
        
        {/* Day Columns */}
        {DAYS.map((day) => {
          const isHoliday = HOLIDAYS.includes(day as typeof HOLIDAYS[number]);
          const isToday = day === currentDay;
          const dayEntries = getEntriesForDay(day);
          
          return (
            <div
              key={day}
              className={cn(
                "flex-1 min-w-[120px] relative border-r last:border-r-0",
                isHoliday && "bg-muted/30",
                isToday && "bg-primary/5"
              )}
            >
              {/* Grid Lines */}
              {timeSlots.map((_, index) => (
                <div 
                  key={index}
                  className="border-b border-dashed border-muted-foreground/10"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
              
              {/* Holiday Overlay */}
              {isHoliday && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-muted/80 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-medium text-muted-foreground">Holiday</span>
                  </div>
                </div>
              )}
              
              {/* Class Blocks */}
              {!isHoliday && (
                <div className="absolute inset-0 p-0.5">
                  {dayEntries.map((entry) => {
                    const { top, height } = getBlockStyle(entry.time_slot);
                    return (
                      <div
                        key={entry.id}
                        className="absolute left-0.5 right-0.5"
                        style={{ top, height }}
                      >
                        <CalendarClassBlock entry={entry} compact={height < 50} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
