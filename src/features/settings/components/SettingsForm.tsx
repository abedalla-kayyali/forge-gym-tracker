import { User } from 'lucide-react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { useProfileStore } from '../../../stores/useProfileStore';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';

export function SettingsForm() {
  const { settings, setTheme, setLanguage, toggleSound, toggleHaptic } = useSettingsStore();
  const { profile, updateProfile } = useProfileStore();
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Card className="space-y-3">
        <h3 className="text-forge-muted text-xs font-condensed uppercase">Profile</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/10">
            <User size={18} className="text-forge-green" />
          </div>
          <div>
            <div className="text-forge-text text-sm">{profile.name || 'Guest'}</div>
            <div className="text-forge-dim text-xs">{user?.email ?? 'Guest mode'}</div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Display name"
          value={profile.name}
          onChange={(e) => updateProfile({ name: e.target.value })}
          className="w-full bg-forge-surface border border-forge-border rounded-lg px-3 py-2 text-forge-text text-sm focus:outline-none focus:border-forge-green focus:shadow-[0_0_0_2px_rgba(46,204,113,0.15)] transition-all"
        />
      </Card>

      {/* Appearance */}
      <Card className="space-y-3">
        <h3 className="text-forge-muted text-xs font-condensed uppercase">Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-forge-text text-sm">Theme</span>
          <div className="flex gap-1">
            {(['dark', 'light', 'auto'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 min-h-[36px] rounded text-xs font-condensed cursor-pointer press-scale transition-all ${
                  settings.theme === t
                    ? 'bg-forge-green text-forge-bg shadow-[0_0_8px_rgba(46,204,113,0.3)]'
                    : 'bg-forge-bg text-forge-muted border border-forge-border hover:border-forge-green/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-forge-text text-sm">Language</span>
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
        <h3 className="text-forge-muted text-xs font-condensed uppercase">Effects</h3>
        <ToggleRow label="Sound effects" checked={settings.sound} onToggle={toggleSound} />
        <ToggleRow label="Haptic feedback" checked={settings.haptic} onToggle={toggleHaptic} />
      </Card>

      {/* Account */}
      {user && (
        <button
          onClick={signOut}
          className="w-full bg-red-600/20 text-red-400 border border-red-600/30 min-h-[44px] rounded-lg font-condensed text-sm cursor-pointer press-scale"
        >
          Sign Out
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
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
