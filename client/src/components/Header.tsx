import { User, Settings } from "lucide-react";
import * as React from "react";
import useAuth from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [renderKey, setRenderKey] = React.useState<number>(0);
  
  // Force header to re-render when component mounts
  React.useEffect(() => {
    console.log("Header mounted, current user:", user);
    
    // Force re-render once after a slight delay
    const timer = setTimeout(() => {
      setRenderKey(prev => prev + 1);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simple function to shorten addresses for display
  const shortenAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  console.log("Header component rendering with key:", renderKey, "Auth state:", { user, isAuthenticated });
  
  const displayName = user?.farcasterAddress 
    ? shortenAddress(user.farcasterAddress) 
    : (user?.walletAddress 
        ? shortenAddress(user.walletAddress) 
        : user?.username || "User");
  
  return (
    <header className="border-b border-darkgray">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="font-cinzel font-bold text-gold text-2xl">MOTE RUNES</h1>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center px-3 py-1.5 rounded-full border border-gold/40 text-sm bg-black/50">
            <User className="text-gold mr-2 h-4 w-4" />
            <span className="text-offwhite">{displayName}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gold hover:text-offwhite transition duration-300 ml-2">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {}}>
                <Settings className="mr-2 h-4 w-4" />
                <span>App Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
