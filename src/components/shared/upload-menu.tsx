'use client';
import { useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/locale-context';

/**
 * Upload control offering three sources — handy on mobile:
 *  - Camera  (capture="environment" opens the camera directly)
 *  - Gallery (image/* without capture opens the photo library)
 *  - Files   (documents)
 * Falls back gracefully on desktop, where each just opens a file picker
 * filtered to the relevant types.
 */
export function UploadMenu({
  onPick, uploading, label, variant = 'link',
}: {
  onPick: (file: File) => void;
  uploading?: boolean;
  label: string;
  variant?: 'link' | 'button';
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  const pick = (ref: React.RefObject<HTMLInputElement | null>) => { setOpen(false); ref.current?.click(); };
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
    e.currentTarget.value = '';
  };

  const trigger = variant === 'button'
    ? 'inline-flex items-center gap-2 text-xs font-medium text-white bg-primary rounded-md px-3 py-2 cursor-pointer'
    : 'inline-flex items-center gap-2 text-xs font-medium text-accent cursor-pointer';

  return (
    <div className="relative inline-block">
      <button type="button" className={trigger} disabled={uploading} onClick={() => setOpen((v) => !v)}>
        📎 {uploading ? t('tasks.uploading') : label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 min-w-[180px] rounded-lg border border-input bg-white shadow-lg overflow-hidden end-0">
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-start" onClick={() => pick(cameraRef)}>
              📷 <span>{t('tasks.takePhoto')}</span>
            </button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-start border-t border-input" onClick={() => pick(galleryRef)}>
              🖼️ <span>{t('tasks.fromGallery')}</span>
            </button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-start border-t border-input" onClick={() => pick(filesRef)}>
              📄 <span>{t('tasks.fromFiles')}</span>
            </button>
          </div>
        </>
      )}

      {/* Hidden inputs: camera opens the device camera; gallery opens photos;
          files opens documents. */}
      <input ref={cameraRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handle} />
      <input ref={galleryRef} type="file" className="hidden" accept="image/*" onChange={handle} />
      <input ref={filesRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx" onChange={handle} />
    </div>
  );
}
