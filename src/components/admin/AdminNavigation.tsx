import { Button } from "@/components/ui/button";
import { LayoutDashboard, Trophy, Image, Megaphone, Settings } from "lucide-react";

interface AdminNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  pendingCount: number;
}

export function AdminNavigation({
  activeSection,
  onSectionChange,
  pendingCount,
}: AdminNavigationProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "contests",
      label: "Contests",
      icon: Trophy,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: "overlays", label: "Overlays", icon: Image },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="w-64 bg-card border-r border-border p-4 space-y-2">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-primary">Admin Panel</h2>
        <p className="text-xs text-muted-foreground">Manage your app</p>
      </div>
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={activeSection === item.id ? "secondary" : "ghost"}
          className="w-full justify-start gap-2 relative"
          onClick={() => onSectionChange(item.id)}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
          {item.badge && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </Button>
      ))}
    </nav>
  );
}
