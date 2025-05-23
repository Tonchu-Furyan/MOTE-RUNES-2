import { format } from "date-fns";
import { RuneCount } from "@/lib/runes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RuneCountItemProps {
  runeCount: RuneCount;
  onClick?: () => void;
}

export default function RuneCountItem({ runeCount, onClick }: RuneCountItemProps) {
  const { rune, count, firstPulledAt, lastPulledAt } = runeCount;
  const rarityColors = {
    common: "bg-gray-500",
    uncommon: "bg-green-600",
    rare: "bg-blue-600",
    epic: "bg-purple-600",
    legendary: "bg-amber-500"
  };
  
  const rarityLabels = {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary"
  };
  
  return (
    <Card 
      className="border border-darkgray hover:border-gold rounded-lg transition duration-300 cursor-pointer relative"
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 ${rarityColors[rune.rarity as keyof typeof rarityColors]} text-white text-xs py-1 px-2 rounded-bl-md rounded-tr-md`}>
        {rarityLabels[rune.rarity as keyof typeof rarityLabels]}
      </div>
      <CardContent className="p-6 relative">
        
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-cinzel text-gold text-xl">{rune.name}</h3>
            <p className="text-sm text-lightgray">{rune.meaning}</p>
          </div>
          <div className="text-5xl text-gold font-cinzel">{rune.symbol}</div>
        </div>
        
        <div className="text-sm text-lightgray mb-4 line-clamp-2">
          {rune.interpretation.substring(0, 80)}...
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-lightgray opacity-70">
            First: {format(new Date(firstPulledAt), 'MM/dd/yyyy')}
          </div>
          <div className="text-2xl text-gold font-cinzel flex items-center">
            <span className="mr-1 text-sm">×</span>{count}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}