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
          <div className="w-10 h-10 rounded-full bg-forge-green/20 flex items-center justify-center text-forge-green font-display text-lg">
            {(profile.name || 'G')[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-forge-text text-sm">{profile.name || 'Guest'}</div>
            <div className="text-forge-muted text-xs">{user?.email ?? 'Guest mode'}</div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Display name"
          value={profile.name}
          onChange={(e) => updateProfile({ name: e.target.value })}
          className="w-full bg-forge-bg border border-forge-border rounded-lg px-3 py-2 text-forge-text text-sm focus:outline-none focus:border-forge-green"
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
                className={`px-3 py-1 rounded text-xs font-condensed ${
                  settings.theme === t ? 'bg-forge-green text-forge-bg' : 'bg-forge-bg text-forge-muted border border-forge-border'
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
                className={`px-3 py-1 rounded text-xs font-condensed ${
                  settings.language === l ? 'bg-forge-green text-forge-bg' : 'bg-forge-bg text-forge-muted border border-forge-border'
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
          className="w-full bg-red-600/20 text-red-400 border border-red-600/30 py-2.5 rounded-lg font-condensed text-sm"
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
        className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-forge-green' : 'bg-forge-border'}`}
        role="switch"
        aria-checked={checked}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
