import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backTo?: string;
  actions?: ReactNode;
}

export const MobileLayout = ({ 
  children, 
  title, 
  showBackButton = false, 
  backTo = "/dashboard",
  actions 
}: MobileLayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 animate-slide-down">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <Button variant="ghost" size="sm" asChild className="mobile-tap">
                <Link to={backTo}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {actions}
            {isDashboard && (
              <Button variant="ghost" size="sm" onClick={signOut} className="mobile-tap">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fab animate-scale-in">
        <Button asChild size="lg" className="w-full h-full bg-transparent hover:bg-transparent">
          <Link to="/sales/new">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
};