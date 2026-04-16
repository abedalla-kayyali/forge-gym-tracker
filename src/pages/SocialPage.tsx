import { Swords, Trophy, Globe } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function SocialPage() {
  return (
    <div className="p-4 space-y-4 pb-20 page-enter">
      <h2 className="text-forge-green font-display text-2xl">Social</h2>

      <Card className="flex items-center gap-4 py-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/10">
          <Swords size={24} className="text-forge-green" />
        </div>
        <div>
          <h3 className="text-forge-text font-condensed font-semibold">Duels</h3>
          <p className="text-forge-dim text-sm">Challenge friends to workout battles</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 py-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/10">
          <Trophy size={24} className="text-forge-green" />
        </div>
        <div>
          <h3 className="text-forge-text font-condensed font-semibold">Leaderboard</h3>
          <p className="text-forge-dim text-sm">See how you rank against others</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 py-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/10">
          <Globe size={24} className="text-forge-green" />
        </div>
        <div>
          <h3 className="text-forge-text font-condensed font-semibold">Community Library</h3>
          <p className="text-forge-dim text-sm">Shared exercises and meal plans</p>
        </div>
      </Card>
    </div>
  );
}
