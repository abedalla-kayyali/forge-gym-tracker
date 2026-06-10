import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Swords, Trophy, Globe, Share2, Users, Flame } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TabPills } from '../components/ui/TabPills';
import { SessionPoster } from '../features/poster/components/SessionPoster';
import { useWorkoutStore } from '../stores/useWorkoutStore';

type SocialTab = 'feed' | 'duels' | 'leaderboard' | 'library';

const TABS: { id: SocialTab; labelKey: string; Icon: typeof Swords }[] = [
  { id: 'feed',        labelKey: 'social.tabFeed',        Icon: Flame },
  { id: 'duels',       labelKey: 'social.tabDuels',       Icon: Swords },
  { id: 'leaderboard', labelKey: 'social.tabBoard',       Icon: Trophy },
  { id: 'library',     labelKey: 'social.tabLibrary',     Icon: Globe },
];

export function SocialPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SocialTab>('feed');
  const [posterOpen, setPosterOpen] = useState(false);
  const workouts = useWorkoutStore((s) => s.workouts);
  const latest = workouts[0] ?? null;

  const tabs = TABS.map((tabDef) => ({ id: tabDef.id, label: t(tabDef.labelKey), Icon: tabDef.Icon }));

  return (
    <div className="p-4 space-y-4 page-enter">
      <h2 className="text-forge-green font-display text-2xl tracking-wide">{t('social.title')}</h2>

      {/* Sub-tabs (premium unified) */}
      <TabPills tabs={tabs} value={tab} onChange={setTab} ariaLabel={t('social.subNavAria')} />

      {tab === 'feed' && (
        <FeedTab latest={latest} onSharePoster={() => setPosterOpen(true)} />
      )}
      {tab === 'duels'       && <DuelsTab />}
      {tab === 'leaderboard' && <LeaderboardTab />}
      {tab === 'library'     && <LibraryTab />}

      <SessionPoster
        open={posterOpen}
        onClose={() => setPosterOpen(false)}
        workout={latest}
      />
    </div>
  );
}

/* ───────────────────────── Feed ───────────────────────── */

function FeedTab({
  latest,
  onSharePoster,
}: {
  latest: ReturnType<typeof useWorkoutStore.getState>['workouts'][number] | null;
  onSharePoster: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {/* Share last session CTA */}
      <Card variant="luxury" className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green/25 to-forge-green/5 flex items-center justify-center border border-forge-green/20 shrink-0">
            <Share2 size={18} className="text-forge-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-forge-text font-condensed font-semibold text-[15px]">
              {t('social.shareSession')}
            </div>
            <div className="text-forge-muted text-[12px] leading-snug mt-0.5">
              {latest
                ? t('social.sharePosterPrompt', { name: latest.name })
                : t('social.shareLockedHint')}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!latest}
            onClick={onSharePoster}
          >
            <Share2 size={15} /> {t('social.generatePoster')}
          </Button>
        </div>
      </Card>

      {/* Empty-state placeholder for friend feed (stub — real feed needs social backend) */}
      <Card className="p-6 flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-1">
          <Users size={20} className="text-forge-muted" />
        </div>
        <div className="text-forge-text font-condensed font-semibold">{t('social.noFriends')}</div>
        <div className="text-forge-muted text-[13px] leading-snug max-w-[260px]">
          {t('social.inviteCrew')}
        </div>
        <Badge variant="gold" className="mt-1">{t('social.comingSoon')}</Badge>
      </Card>
    </div>
  );
}

/* ───────────────────────── Duels ───────────────────────── */

function DuelsTab() {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <Card variant="hero" className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forge-ember/25 to-forge-ember/5 flex items-center justify-center border border-forge-ember/20 shrink-0">
            <Swords size={22} className="text-forge-ember" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-forge-text font-condensed font-semibold text-[16px]">{t('social.duels')}</h3>
              <Badge variant="ember" dot>{t('social.upcoming')}</Badge>
            </div>
            <p className="text-forge-muted text-[13px] leading-relaxed">
              {t('social.duelsDescription')}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {/* Gold badge — these duel metrics are placeholder data */}
        <div className="mb-2">
          <Badge variant="gold">{t('social.preview')}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <DuelCell label={t('social.duelVolumeWeek')} metric="+12%" accent="green" />
          <DuelCell label={t('social.duelPrRace')} metric="3 / 5" accent="gold" />
          <DuelCell label={t('social.duelStreak')}  metric="4 d"   accent="ember" />
        </div>
      </Card>
    </div>
  );
}

function DuelCell({ label, metric, accent }: { label: string; metric: string; accent: 'green' | 'gold' | 'ember' }) {
  const accentCls = {
    green: 'text-forge-green',
    gold:  'text-forge-gold',
    ember: 'text-forge-ember',
  }[accent];
  return (
    <div className="card-elevated rounded-xl py-3">
      <div className={`kpi-lg ${accentCls}`}>{metric}</div>
      <div className="label-cap mt-0.5 text-[9px]">{label}</div>
    </div>
  );
}

/* ───────────────────────── Leaderboard ───────────────────────── */

function LeaderboardTab() {
  const { t } = useTranslation();
  const rows = [
    { rank: 1, name: t('social.you'), xp: 0, tagKey: 'social.tagRookie', you: true  },
    { rank: 2, name: 'Ahmed',         xp: 0, tagKey: 'social.tagNone',   you: false },
    { rank: 3, name: 'Sarah',         xp: 0, tagKey: 'social.tagNone',   you: false },
  ];
  return (
    <div className="space-y-2">
      <Card className="p-4 flex items-center gap-3">
        <Trophy size={20} className="text-forge-gold" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-forge-text font-condensed font-semibold">{t('social.globalBoard')}</span>
            {/* Gold badge — leaderboard rows below are seed/placeholder data */}
            <Badge variant="gold">{t('social.preview')}</Badge>
          </div>
          <div className="text-forge-muted text-[12px]">{t('social.boardDescription')}</div>
        </div>
      </Card>
      {rows.map((r) => (
        <Card key={r.rank} className={`p-3.5 flex items-center gap-3 ${r.you ? 'card-luxury-border' : ''}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-display shrink-0 ${
            r.rank === 1 ? 'bg-gradient-to-br from-forge-gold-light to-forge-gold text-forge-bg-deep' :
            r.rank === 2 ? 'bg-white/10 text-forge-text-soft' :
                           'bg-white/5 text-forge-muted'
          }`}>
            {r.rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-forge-text font-condensed font-semibold truncate">{r.name}</span>
              {r.you && <Badge variant="success" dot>{t('social.you')}</Badge>}
            </div>
            <div className="text-forge-muted text-[11px] font-condensed">{t(r.tagKey)}</div>
          </div>
          <div className="kpi-md text-forge-green">{r.xp}<span className="text-[10px] text-forge-muted ms-0.5">{t('social.xp')}</span></div>
        </Card>
      ))}
      <p className="text-center text-[11px] text-forge-muted mt-2 font-condensed">
        {t('social.boardSeedNote')}
      </p>
    </div>
  );
}

/* ───────────────────────── Library ───────────────────────── */

function LibraryTab() {
  const { t } = useTranslation();
  const items = [
    { icon: Globe,   titleKey: 'social.libCommunityTitle', subtitleKey: 'social.libCommunitySubtitle' },
    { icon: Flame,   titleKey: 'social.libTrendingTitle',  subtitleKey: 'social.libTrendingSubtitle' },
    { icon: Trophy,  titleKey: 'social.libCoachTitle',     subtitleKey: 'social.libCoachSubtitle' },
  ];
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <Card key={it.titleKey} variant="luxury" className="p-4 flex items-center gap-3" hoverable>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 border border-forge-green/15 flex items-center justify-center shrink-0">
            <it.icon size={18} className="text-forge-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-forge-text font-condensed font-semibold text-[15px]">{t(it.titleKey)}</div>
            <div className="text-forge-muted text-[12px] leading-snug">{t(it.subtitleKey)}</div>
          </div>
          <Badge variant="gold">{t('social.soon')}</Badge>
        </Card>
      ))}
    </div>
  );
}
