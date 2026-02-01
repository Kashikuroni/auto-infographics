import { Canvas } from '../Canvas/Canvas';
import { LayersPanel } from '../LayersPanel/LayersPanel';
import { PropertiesPanel } from '../PropertiesPanel/PropertiesPanel';
import { Toolbar } from '../Toolbar/Toolbar';
import { GalleryOverlay } from '../GalleryOverlay/GalleryOverlay';
import { TabBar } from '../TabBar/TabBar';
import { GalleryTab } from '../GalleryTab/GalleryTab';
import { TableTab } from '../TableTab/TableTab';
import { useEditorStore } from '../../store/editorStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import styles from './Editor.module.css';

export function Editor() {
  useKeyboardShortcuts();
  const activeTab = useEditorStore((state) => state.activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'gallery':
        return <GalleryTab />;
      case 'table':
        return <TableTab />;
      case 'editor':
      default:
        return (
          <>
            <Toolbar />
            <div className={styles.workspace}>
              <LayersPanel />
              <div className={styles.canvasArea}>
                <Canvas />
              </div>
              <PropertiesPanel />
            </div>
          </>
        );
    }
  };

  return (
    <div className={styles.editor}>
      <TabBar />
      <div className={styles.content}>
        {renderContent()}
      </div>
      <GalleryOverlay />
    </div>
  );
}
