import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LayoutGrid, List, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarClassBlock } from "./CalendarClassBlock";
import { DaySchedule } from "./DaySchedule";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// All days including Sunday/Monday for List view
const ALL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const ALL_SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
// Working days only for Grid view (no Sunday/Monday holidays)
const DAYS = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const SHORT_DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat"] as const;

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

interface CalendarViewProps {
  entries: TimetableEntry[];
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

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

function getDayIndex(dayName: string): number {
  return DAYS.indexOf(dayName as typeof DAYS[number]);
}

export function CalendarView({ entries }: CalendarViewProps) {
  const isMobile = useIsMobile();
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  
  const todayWorkingIndex = getDayIndex(currentDay);
  const initialDayIndex = todayWorkingIndex >= 0 ? todayWorkingIndex : 0;
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialDayIndex);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  
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

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      // Switch to list view showing that day
      setViewMode('list');
      setListViewDay(dayName);
    }
  };

  const todayAllDaysIndex = ALL_DAYS.indexOf(currentDay as typeof ALL_DAYS[number]);
  const defaultListDay = todayAllDaysIndex >= 0 ? ALL_DAYS[todayAllDaysIndex] : ALL_DAYS[0];
  const [listViewDay, setListViewDay] = useState<string>(defaultListDay);

  // Calendar date picker component
  const DatePicker = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5" />
          {selectedDate ? format(selectedDate, "MMM d") : "Pick Date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  // List View Component
  const ListView = () => {
    const isHoliday = listViewDay === "Sunday" || listViewDay === "Monday";
    
    return (
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2 pb-3 border-b">
          {ALL_DAYS.map((day, index) => {
            const isToday = day === currentDay;
            const isSelected = listViewDay === day;
            const isDayHoliday = day === "Sunday" || day === "Monday";
            
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
                      : isDayHoliday
                        ? "bg-muted/50 text-muted-foreground/60 hover:bg-muted/70"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {ALL_SHORT_DAYS[index]}
                {isToday && !isSelected && (
                  <span className="ml-1 text-xs opacity-70">•</span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="animate-fade-in">
          <DaySchedule
            day={listViewDay}
            entries={getEntriesForDay(listViewDay)}
            isHoliday={isHoliday}
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
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">{getWeekRangeString()}</p>
            <div className="flex items-center gap-2">
              <DatePicker />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-7 text-xs gap-1.5 transition-all"
              >
                {viewMode === 'grid' ? (
                  <><List className="w-3.5 h-3.5" />List</>
                ) : (
                  <><LayoutGrid className="w-3.5 h-3.5" />Grid</>
                )}
              </Button>
            </div>
          </div>

          {viewMode === 'grid' && (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateDay('prev')} disabled={selectedDayIndex === 0} className="transition-transform active:scale-90">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                  <h3 className={cn("font-semibold text-lg transition-colors", selectedDay === currentDay && "text-primary")}>{selectedDay}</h3>
                  {selectedDay === currentDay && <span className="text-xs text-primary animate-fade-in">Today</span>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigateDay('next')} disabled={selectedDayIndex === DAYS.length - 1} className="transition-transform active:scale-90">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
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
              <div className="w-14 flex-shrink-0 border-r bg-muted/20">
                {timeSlots.map((time) => (
                  <div key={time} className="text-xs text-muted-foreground pr-2 text-right flex items-start pt-1" style={{ height: HOUR_HEIGHT }}>
                    {time.replace(':00', '')}
                  </div>
                ))}
              </div>
              
              <div className="flex-1 relative">
                {timeSlots.map((_, index) => (
                  <div key={index} className="border-b border-muted-foreground/10" style={{ height: HOUR_HEIGHT }} />
                ))}
                
                <div className="absolute inset-0 p-1">
                  {dayEntries.map((entry, index) => {
                    const { top, height } = getBlockStyle(entry.time_slot);
                    return (
                      <div key={entry.id} className="absolute left-1 right-1 animate-scale-in" style={{ top, height, animationDelay: `${index * 50}ms` }}>
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
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b">
        <div className="flex items-center justify-between py-2 px-4 border-b bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">{getWeekRangeString()}</span>
          <div className="flex items-center gap-2">
            <DatePicker />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="h-7 text-xs gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              {viewMode === 'grid' ? (
                <><List className="w-3.5 h-3.5" />List View</>
              ) : (
                <><LayoutGrid className="w-3.5 h-3.5" />Grid View</>
              )}
            </Button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="flex">
            <div className="w-16 flex-shrink-0 border-r" />
            {DAYS.map((day, index) => {
              const isToday = day === currentDay;
              return (
                <div key={day} className={cn("flex-1 text-center py-3 border-r last:border-r-0 transition-all duration-300", isToday && "bg-primary/10")} style={{ animationDelay: `${index * 30}ms` }}>
                  <span className={cn("text-sm font-medium transition-colors", isToday && "text-primary font-semibold")}>{day.slice(0, 3)}</span>
                  {isToday && <div className="w-2 h-2 rounded-full bg-primary mx-auto mt-1 animate-pulse" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <ListView />
      ) : (
        <div className="flex overflow-x-auto" ref={scrollRef}>
          <div className="w-16 flex-shrink-0 border-r bg-muted/20">
            {timeSlots.map((time, index) => (
              <div key={time} className="text-xs text-muted-foreground px-2 text-right flex items-start pt-1 animate-fade-in" style={{ height: HOUR_HEIGHT, animationDelay: `${index * 20}ms` }}>
                {time.replace(':00', '')}
              </div>
            ))}
          </div>
          
          {DAYS.map((day, dayIndex) => {
            const isToday = day === currentDay;
            const dayEntries = getEntriesForDay(day);
            
            return (
              <div key={day} className={cn("flex-1 min-w-[140px] relative border-r last:border-r-0 transition-colors duration-300", isToday && "bg-primary/5 ring-1 ring-inset ring-primary/20")}>
                {timeSlots.map((_, index) => (
                  <div key={index} className="border-b border-muted-foreground/10" style={{ height: HOUR_HEIGHT }} />
                ))}
                
                <div className="absolute inset-0 p-1">
                  {dayEntries.map((entry, entryIndex) => {
                    const { top, height } = getBlockStyle(entry.time_slot);
                    return (
                      <div key={entry.id} className="absolute left-1 right-1 animate-scale-in" style={{ top, height, animationDelay: `${(dayIndex * 50) + (entryIndex * 30)}ms` }}>
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
