import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/hooks/useStudent";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, LogOut, Settings, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const { student, clearStudent } = useStudent();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleClearSession = () => {
    clearStudent();
    navigate("/entry");
  };

  const handleAdminSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (rollNumber: string) => {
    return rollNumber.slice(-2);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center group-hover:animate-pulse-glow transition-all">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-space font-bold text-lg text-foreground">CSD Timetable</h1>
            <p className="text-xs text-muted-foreground">Semester 6</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          {/* Show admin button if logged in as admin */}
          {user && isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminSignOut}
                className="gap-2 text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}

          {/* Show student dropdown if student is logged in */}
          {student?.rollNumber && !user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold font-mono">
                      {getInitials(student.rollNumber)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-mono">
                      {getInitials(student.rollNumber)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium font-mono">{student.rollNumber}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearSession} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Clear Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Show entry button if no student and not admin */}
          {!student?.rollNumber && !user && (
            <Button onClick={() => navigate("/entry")} className="gradient-primary">
              Get Started
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
