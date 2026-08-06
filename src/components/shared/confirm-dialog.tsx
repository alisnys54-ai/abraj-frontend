'use client';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function useConfirmDialog() {
  const [state, setState] = useState<{ open: boolean; title: string; body: string; onConfirm: () => void }>({
    open: false, title: '', body: '', onConfirm: () => {},
  });

  const confirm = (title: string, body: string, onConfirm: () => void) => setState({ open: true, title, body, onConfirm });
  const close = () => setState((s) => ({ ...s, open: false }));

  const dialog = (
    <Dialog open={state.open} onOpenChange={(open) => !open && close()}>
      <DialogContent title={state.title}>
        <p className="text-sm text-muted-foreground mb-5">{state.body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button variant="destructive" onClick={() => { state.onConfirm(); close(); }}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}
