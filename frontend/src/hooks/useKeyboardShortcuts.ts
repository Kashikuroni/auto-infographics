import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

export function useKeyboardShortcuts() {
  const { zoomIn, zoomOut, setZoom, deleteObject, selectedIds } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // + или = для zoom in
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      }

      // - для zoom out
      if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      }

      // Cmd/Ctrl + 0 для reset zoom
      if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoom(1);
      }

      // Delete/Backspace для удаления выбранных объектов
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedIds.forEach((id) => deleteObject(id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, setZoom, deleteObject, selectedIds]);
}
