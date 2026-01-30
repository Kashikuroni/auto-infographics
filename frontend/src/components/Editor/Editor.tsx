import { Canvas } from '../Canvas/Canvas';
import { LayersPanel } from '../LayersPanel/LayersPanel';
import { PropertiesPanel } from '../PropertiesPanel/PropertiesPanel';
import { Toolbar } from '../Toolbar/Toolbar';
import { GalleryOverlay } from '../GalleryOverlay/GalleryOverlay';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import styles from './Editor.module.css';

export function Editor() {
  useKeyboardShortcuts();

  return (
    <div className={styles.editor}>
      <Toolbar />
      <div className={styles.workspace}>
        <LayersPanel />
        <div className={styles.canvasArea}>
          <Canvas />
        </div>
        <PropertiesPanel />
      </div>
      <GalleryOverlay />
    </div>
  );
}
