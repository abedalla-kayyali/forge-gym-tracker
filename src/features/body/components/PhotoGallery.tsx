import { useState, useCallback, useMemo } from 'react';
import { readStorage, writeStorage } from '../../../lib/storage';
import { useToast } from '../../../components/ui/Toast';
import type { BodyPhoto } from '../../../types/body';

const PHOTOS_KEY = 'forge_body_photos';

export function PhotoGallery() {
  const [photos, setPhotos] = useState<BodyPhoto[]>(() =>
    readStorage<BodyPhoto[]>(PHOTOS_KEY, []),
  );
  const { toast } = useToast();

  const sorted = useMemo(() => {
    return [...photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [photos]);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const photo: BodyPhoto = {
          id: `photo_${Date.now()}`,
          date: new Date().toISOString(),
          dataUrl: reader.result as string,
          type: 'front',
        };
        const updated = [...photos, photo];
        writeStorage(PHOTOS_KEY, updated);
        setPhotos(updated);
        toast('Photo added!', 'success');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [photos, toast],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = photos.filter((p) => p.id !== id);
      writeStorage(PHOTOS_KEY, updated);
      setPhotos(updated);
      toast('Photo removed', 'info');
    },
    [photos, toast],
  );

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <label className="flex items-center justify-center gap-2 bg-forge-surface border border-dashed border-forge-border rounded-xl py-4 cursor-pointer hover:border-forge-green/50 transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forge-muted">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="text-forge-muted text-sm font-condensed">Add Progress Photo</span>
        <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
      </label>

      {/* Photo grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {sorted.map((p) => (
            <div key={p.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-forge-surface">
              <img src={p.dataUrl} alt="Progress" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                <span className="text-white text-[9px] font-mono">
                  {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                aria-label="Delete photo"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-forge-muted text-sm text-center py-4 font-condensed">
          No progress photos yet
        </p>
      )}
    </div>
  );
}
