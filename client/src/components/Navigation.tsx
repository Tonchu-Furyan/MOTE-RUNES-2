import { Sparkles, History as HistoryIcon, User, LogOut } from "lucide-react";
import useAuth from "@/hooks/useAuth";

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const { logout } = useAuth();
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-darkgray border-t border-gold/30 py-3 px-4 z-50">
      <div className="container mx-auto flex justify-around items-center">
        <button 
          className={`flex flex-col items-center ${activeView === "daily" ? "text-gold" : "text-lightgray hover:text-gold transition duration-300"}`}
          onClick={() => onViewChange("daily")}
          aria-label="Daily Rune"
        >
          <Sparkles className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Daily</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${activeView === "history" ? "text-gold" : "text-lightgray hover:text-gold transition duration-300"}`}
          onClick={() => onViewChange("history")}
          aria-label="Rune History"
        >
          <HistoryIcon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">History</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-lightgray hover:text-gold transition duration-300"
          onClick={() => {}}
          aria-label="User Profile"
        >
          <User className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-lightgray hover:text-red-400 transition duration-300"
          onClick={logout}
          aria-label="Log Out"
        >
          <LogOut className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
