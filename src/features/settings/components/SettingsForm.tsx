import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { useProfileStore } from '../../../stores/useProfileStore';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';

export function SettingsForm() {
  const { t } = useTranslation();
  const { settings, setTheme, setLanguage, toggleSound, toggleHaptic } = useSettingsStore();
  const { profile, updateProfile } = useProfileStore();
  const { user, signOut } = useAuth();

  const themeLabels: Record<'dark' | 'light' | 'auto', string> = {
    dark: t('settings.themeDark'),
    light: t('settings.themeLight'),
    auto: t('settings.themeAuto'),
  };

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Card className="space-y-3">
        <h3 className="text-forge-muted text-xs font-condensed uppercase">{t('settings.profile')}</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/10">
            <User size={18} className="text-forge-green" />
          </div>
          <div>
            <div className="text-forge-text text-sm">{profile.name || t('auth.guest')}</div>
            <div className="text-forge-dim text-xs">{user?.email ?? t('settings.guestMode')}</div>
          </div>
        </div>
        <input
          type="text"
          placeholder={t('settings.displayName')}
          value={profile.name}
          onChange={(e) => updateProfile({ name: e.target.value })}
          className="w-full bg-forge-surface border border-forge-border rounded-lg px-3 py-2 text-forge-text text-sm focus:outline-none focus:border-forge-green focus:shadow-[0_0_0_2px_rgba(46,204,113,0.15)] transition-all"
        />
      </Card>

      {/* Appearance */}
      <Card className="space-y-3">
        <h3 className="text-forge-muted text-xs font-condensed uppercase">{t('settings.appearance')}</h3>
        <div className="flex items-center justify-between">
          <span className="text-forge-text text-sm">{t('settings.theme')}</span>
          <div className="flex gap-1">
            {(['dark', 'light', 'auto'] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`px-3 min-h-[36px] rounded text-xs font-condensed cursor-pointer press-scale transition-all ${
                  settings.theme === themeOption
                    ? 'bg-forge-green text-forge-bg shadow-[0_0_8px_rgba(46,204,113,0.3)]'
                    : 'bg-forge-bg text-forge-muted border border-forge-border hover:border-forge-green/40'
                }`}
              >
                {themeLabels[themeOption]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-forge-text text-sm">{t('settings.language')}</span>
          <div className="flex gap-1">
            {(['en', 'ar'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-3 min-h-[36px] rounded text-xs font-condensed cursor-pointer press-scale transition-all ${
                  settings.language === l
                    ? 'bg-forge-green text-forge-bg shadow-[0_0_8px_rgba(46,204,113,0.3)]'
                    : 'bg-forge-bg text-forge-muted border border-forge-border hover:border-forge-green/40'
                }`}
              >
                {l === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Effects */}
      <Card className="space-y-3">
        <h3 className="text-forge-muted text-xs font-condensed uppercase">{t('settings.effects')}</h3>
        <ToggleRow label={t('settings.soundEffects')} checked={settings.sound} onToggle={toggleSound} />
        <ToggleRow label={t('settings.hapticFeedback')} checked={settings.haptic} onToggle={toggleHaptic} />
      </Card>

      {/* Account */}
      {user && (
        <button
          onClick={signOut}
          className="w-full bg-red-600/20 text-red-400 border border-red-600/30 min-h-[44px] rounded-lg font-condensed text-sm cursor-pointer press-scale"
        >
          {t('auth.signOut')}
        </button>
      )}
    </div>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-forge-text text-sm">{label}</span>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
          checked
            ? 'bg-forge-green shadow-[0_0_8px_rgba(46,204,113,0.4)]'
            : 'bg-forge-border'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
            checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
