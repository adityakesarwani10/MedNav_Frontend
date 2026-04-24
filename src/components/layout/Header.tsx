import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, LogOut, Phone, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleEmergency = () => {
    if (user) navigate("/dashboard?action=sos");
    else navigate("/login?redirect=sos");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-primary group-hover:scale-105 transition-spring">
            <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">MedNav</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          <a href="/#how" className="hover:text-foreground transition-base">How it works</a>
          <a href="/#why" className="hover:text-foreground transition-base">Why MedNav</a>
          <a href="/#live" className="hover:text-foreground transition-base">Live status</a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}
                className="hidden sm:inline-flex"
              >
                {user.role === "admin" ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                {user.role === "admin" ? "Admin Panel" : "Dashboard"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Account menu">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {user.phone}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}>
                    {user.role === "admin" ? <Shield className="mr-2 h-4 w-4" /> : <UserIcon className="mr-2 h-4 w-4" />}
                    {user.role === "admin" ? "Admin Panel" : "My Dashboard"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/login${pathname !== "/" ? `?redirect=${pathname}` : ""}`)}
            >
              <UserIcon className="h-4 w-4" />
              Login
            </Button>
          )}
          <Button variant="emergency" size="sm" onClick={handleEmergency} className="gap-1.5">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Emergency</span>
            <span className="font-bold">SOS</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
