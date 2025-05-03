import { Sun, History as HistoryIcon, Book, User } from "lucide-react";

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-darkgray border-t border-gold/20 py-3 px-4">
      <div className="container mx-auto flex justify-around items-center">
        <button 
          className={`flex flex-col items-center ${activeView === "daily" ? "text-gold" : "text-lightgray hover:text-gold transition duration-300"}`}
          onClick={() => onViewChange("daily")}
        >
          <Sun className="h-5 w-5 mb-1" />
          <span className="text-xs">Daily</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${activeView === "history" ? "text-gold" : "text-lightgray hover:text-gold transition duration-300"}`}
          onClick={() => onViewChange("history")}
        >
          <HistoryIcon className="h-5 w-5 mb-1" />
          <span className="text-xs">History</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-lightgray hover:text-gold transition duration-300"
          onClick={() => {}}
        >
          <Book className="h-5 w-5 mb-1" />
          <span className="text-xs">Learn</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-lightgray hover:text-gold transition duration-300"
          onClick={() => {}}
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </nav>
  );
}
