import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Megaphone, X, ChevronDown, ChevronUp, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  display_duration: number | null;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [timerProgress, setTimerProgress] = useState<Record<string, number>>({});
  const timerRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();
  }, []);

  // Auto-dismiss timer effect
  useEffect(() => {
    announcements.forEach((announcement) => {
      if (
        announcement.display_duration && 
        !dismissedIds.has(announcement.id) &&
        !timerRefs.current[announcement.id]
      ) {
        const duration = announcement.display_duration * 1000;
        const startTime = Date.now();
        
        // Update progress every 100ms
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / duration) * 100, 100);
          setTimerProgress(prev => ({ ...prev, [announcement.id]: progress }));
          
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 100);
        
        // Auto-dismiss after duration
        const timeout = setTimeout(() => {
          handleDismiss(announcement.id);
          clearInterval(progressInterval);
        }, duration);
        
        timerRefs.current[announcement.id] = timeout;
      }
    });

    return () => {
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, [announcements, dismissedIds]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.has(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visibleAnnouncements.map((announcement, index) => (
        <Alert
          key={announcement.id}
          className={cn(
            "relative border-l-4 border-l-accent bg-accent/5 animate-fade-in overflow-hidden",
            "hover:bg-accent/10 transition-all duration-300"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Timer progress bar */}
          {announcement.display_duration && timerProgress[announcement.id] !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
              <div 
                className="h-full bg-accent/50 transition-all duration-100 ease-linear"
                style={{ width: `${100 - timerProgress[announcement.id]}%` }}
              />
            </div>
          )}
          
          <Megaphone className="h-4 w-4 text-accent" />
          <div className="flex-1 pr-8">
            <AlertTitle className="text-foreground font-semibold flex items-center gap-2">
              {announcement.title}
              {announcement.display_duration && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {announcement.display_duration}s
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 transition-transform hover:scale-110"
                onClick={() => toggleExpand(announcement.id)}
              >
                {expandedIds.has(announcement.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </AlertTitle>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                expandedIds.has(announcement.id) 
                  ? "grid-rows-[1fr] opacity-100 mt-2" 
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <AlertDescription className="text-muted-foreground">
                  {announcement.content}
                </AlertDescription>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-all hover:scale-110"
            onClick={() => handleDismiss(announcement.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
