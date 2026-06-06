import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import { readStorage, writeStorage } from '../../../lib/storage';
import { useToast } from '../../../components/ui/Toast';
import type { BodyPhoto } from '../../../types/body';

const PHOTOS_KEY = 'forge_body_photos';

export function PhotoGallery() {
  const { t } = useTranslation();
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
        toast(t('photos.selectImage'), 'error');
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
        toast(t('photos.added'), 'success');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [photos, toast, t],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = photos.filter((p) => p.id !== id);
      writeStorage(PHOTOS_KEY, updated);
      setPhotos(updated);
      toast(t('photos.removed'), 'info');
    },
    [photos, toast, t],
  );

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <label className="flex items-center justify-center gap-2 bg-forge-surface border border-dashed border-forge-border rounded-xl py-4 cursor-pointer hover:border-forge-green/50 transition-colors min-h-[56px]">
        <Camera size={20} className="text-forge-dim" />
        <span className="text-forge-muted text-sm font-condensed">{t('photos.addPhoto')}</span>
        <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
      </label>

      {/* Photo grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {sorted.map((p) => (
            <div key={p.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-forge-surface">
              <img src={p.dataUrl} alt={t('photos.progressAlt')} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                <span className="text-white text-[9px] font-mono">
                  {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer press-scale"
                aria-label={t('photos.deletePhoto')}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-forge-muted text-sm text-center py-4 font-condensed">
          {t('photos.empty')}
        </p>
      )}
    </div>
  );
}
