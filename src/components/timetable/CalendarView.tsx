import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarClassBlock } from "./CalendarClassBlock";
import { DaySchedule } from "./DaySchedule";
import { useIsMobile } from "@/hooks/use-mobile";

// Only working days (no Sunday/Monday holidays)
const DAYS = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const SHORT_DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// Time slots from 8 AM to 5 PM (in hours)
const START_HOUR = 8;
const END_HOUR = 17;
const HOUR_HEIGHT = 70; // pixels per hour - increased for better readability

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

// Map day name to index in our DAYS array
function getDayIndex(dayName: string): number {
  return DAYS.indexOf(dayName as typeof DAYS[number]);
}

export function CalendarView({ entries }: CalendarViewProps) {
  const isMobile = useIsMobile();
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  
  // Find if today is a working day, otherwise default to Tuesday (index 0)
  const todayWorkingIndex = getDayIndex(currentDay);
  const initialDayIndex = todayWorkingIndex >= 0 ? todayWorkingIndex : 0;
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialDayIndex);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  
  // Handle swipe gestures on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedDayIndex < DAYS.length - 1) {
        setAnimationDirection('left');
        setSelectedDayIndex(prev => prev + 1);
      } else if (diff < 0 && selectedDayIndex > 0) {
        setAnimationDirection('right');
        setSelectedDayIndex(prev => prev - 1);
      }
    }
  };
  
  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedDayIndex > 0) {
      setAnimationDirection('right');
      setSelectedDayIndex(prev => prev - 1);
    } else if (direction === 'next' && selectedDayIndex < DAYS.length - 1) {
      setAnimationDirection('left');
      setSelectedDayIndex(prev => prev + 1);
    }
  };

// Calculate position and height for a class block
  const getBlockStyle = (timeSlot: string) => {
    // Handle both "HH:MM - HH:MM" and "HH:MM-HH:MM" formats
    const parts = timeSlot.includes(" - ") ? timeSlot.split(" - ") : timeSlot.split("-");
    const startTime = parts[0]?.trim() || "8:00";
    const endTime = parts[1]?.trim() || "9:00";
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    const startFromBase = startMinutes - START_HOUR * 60;
    const duration = endMinutes - startMinutes;
    
    const top = (startFromBase / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height: Math.max(height, 50) }; // Minimum height of 50px
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

  // Get today's working day or default to Tuesday
  const todayIndex = getDayIndex(currentDay);
  const defaultListDay = todayIndex >= 0 ? DAYS[todayIndex] : DAYS[0];
  const [listViewDay, setListViewDay] = useState<string>(defaultListDay);

  // List View Component
  const ListView = () => {
    return (
      <div className="p-4 space-y-4">
        {/* Day Selection - Today first, then other days */}
        <div className="flex flex-wrap gap-2 pb-3 border-b">
          {DAYS.map((day) => {
            const isToday = day === currentDay;
            const isSelected = listViewDay === day;
            
            return (
              <button
                key={day}
                onClick={() => setListViewDay(day)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : isToday
                      ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {day.slice(0, 3)}
                {isToday && !isSelected && (
                  <span className="ml-1 text-xs opacity-70">•</span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Selected Day Schedule */}
        <div className="animate-fade-in">
          <DaySchedule
            day={listViewDay}
            entries={getEntriesForDay(listViewDay)}
            isHoliday={false}
          />
        </div>
      </div>
    );
  };

  // Mobile single-day view
  if (isMobile) {
    const selectedDay = DAYS[selectedDayIndex];
    const dayEntries = getEntriesForDay(selectedDay);

    return (
      <div className="bg-card rounded-xl border overflow-hidden animate-fade-in">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">{getWeekRangeString()}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="h-7 text-xs gap-1.5 transition-all"
            >
              {viewMode === 'grid' ? (
                <>
                  <List className="w-3.5 h-3.5" />
                  List
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Grid
                </>
              )}
            </Button>
          </div>

          {viewMode === 'grid' && (
            <>
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigateDay('prev')}
                  disabled={selectedDayIndex === 0}
                  className="transition-transform active:scale-90"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                  <h3 className={cn(
                    "font-semibold text-lg transition-colors",
                    selectedDay === currentDay && "text-primary"
                  )}>
                    {selectedDay}
                  </h3>
                  {selectedDay === currentDay && (
                    <span className="text-xs text-primary animate-fade-in">Today</span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigateDay('next')}
                  disabled={selectedDayIndex === DAYS.length - 1}
                  className="transition-transform active:scale-90"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Day pills for quick navigation */}
              <div className="flex gap-1 mt-3 justify-center">
                {SHORT_DAYS.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => {
                      setAnimationDirection(index > selectedDayIndex ? 'left' : 'right');
                      setSelectedDayIndex(index);
                    }}
                    className={cn(
                      "w-9 h-9 rounded-full text-xs font-medium transition-all duration-200",
                      "hover:scale-110 active:scale-95",
                      index === selectedDayIndex 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" 
                        : DAYS[index] === currentDay
                          ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {day[0]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <ListView />
        ) : (
          <div 
            key={selectedDayIndex}
            className={cn(
              "relative",
              animationDirection === 'left' && "animate-slide-in-left",
              animationDirection === 'right' && "animate-slide-in-right"
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onAnimationEnd={() => setAnimationDirection(null)}
          >
            <div className="flex">
              {/* Time Labels */}
              <div className="w-14 flex-shrink-0 border-r bg-muted/20">
                {timeSlots.map((time) => (
                  <div 
                    key={time} 
                    className="text-xs text-muted-foreground pr-2 text-right flex items-start pt-1"
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
                    className="border-b border-muted-foreground/10"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                
                {/* Class Blocks */}
                <div className="absolute inset-0 p-1">
                  {dayEntries.map((entry, index) => {
                    const { top, height } = getBlockStyle(entry.time_slot);
                    return (
                      <div
                        key={entry.id}
                        className="absolute left-1 right-1 animate-scale-in"
                        style={{ 
                          top, 
                          height,
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <CalendarClassBlock entry={entry} compact={height < 70} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop full week view
  return (
    <div className="bg-card rounded-xl border overflow-hidden animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b">
        <div className="flex items-center justify-between py-2 px-4 border-b bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">{getWeekRangeString()}</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="h-7 text-xs gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            {viewMode === 'grid' ? (
              <>
                <List className="w-3.5 h-3.5" />
                List View
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid View
              </>
            )}
          </Button>
        </div>

        {viewMode === 'grid' && (
          <div className="flex">
            {/* Empty corner for time labels */}
            <div className="w-16 flex-shrink-0 border-r" />
            
            {/* Day Headers */}
            {DAYS.map((day, index) => {
              const isToday = day === currentDay;
              
              return (
                <div
                  key={day}
                  className={cn(
                    "flex-1 text-center py-3 border-r last:border-r-0 transition-all duration-300",
                    isToday && "bg-primary/10"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isToday && "text-primary font-semibold"
                  )}>
                    {day.slice(0, 3)}
                  </span>
                  {isToday && (
                    <div className="w-2 h-2 rounded-full bg-primary mx-auto mt-1 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <ListView />
      ) : (
        <div className="flex overflow-x-auto" ref={scrollRef}>
          {/* Time Labels */}
          <div className="w-16 flex-shrink-0 border-r bg-muted/20">
            {timeSlots.map((time, index) => (
              <div 
                key={time} 
                className="text-xs text-muted-foreground px-2 text-right flex items-start pt-1 animate-fade-in"
                style={{ 
                  height: HOUR_HEIGHT,
                  animationDelay: `${index * 20}ms`
                }}
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
                  "flex-1 min-w-[140px] relative border-r last:border-r-0 transition-colors duration-300",
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
                        className="absolute left-1 right-1 animate-scale-in"
                        style={{ 
                          top, 
                          height,
                          animationDelay: `${(dayIndex * 50) + (entryIndex * 30)}ms`
                        }}
                      >
                        <CalendarClassBlock entry={entry} compact={height < 60} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}