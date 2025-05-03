import { format } from "date-fns";
import { RunePull } from "@/lib/runes";
import { Card, CardContent } from "@/components/ui/card";

interface RuneHistoryItemProps {
  runePull: RunePull;
  onClick?: () => void;
}

export default function RuneHistoryItem({ runePull, onClick }: RuneHistoryItemProps) {
  const { rune } = runePull;
  const pullDate = new Date(runePull.pullDate);
  
  return (
    <Card 
      className="border border-darkgray hover:border-gold rounded-lg transition duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-cinzel text-gold text-xl">{rune.name}</h3>
            <p className="text-sm text-lightgray">{rune.meaning}</p>
          </div>
          <div className="text-5xl text-gold font-cinzel">{rune.symbol}</div>
        </div>
        <div className="text-sm text-lightgray mb-4 line-clamp-3">
          {rune.interpretation.substring(0, 100)}...
        </div>
        <div className="text-xs text-lightgray opacity-70">
          {format(pullDate, 'MMMM d, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
}
