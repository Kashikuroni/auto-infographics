import { useEditorStore } from '../../store/editorStore';
import { FolderButton } from './FolderButton';
import { TemplateMenu } from './TemplateMenu';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const { addText, zoom, zoomIn, zoomOut, setZoom } = useEditorStore();

  const handleAddText = () => {
    addText();
  };

  const handleAddImage = () => {
    // TODO: Open file picker
    const src = prompt('Enter image URL (for testing):');
    if (src) {
      useEditorStore.getState().addImage(src);
    }
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.section}>
        <FolderButton />
      </div>

      <div className={styles.section}>
        <button className={styles.button} onClick={handleAddText} title="Add Text">
          <span className={styles.icon}>T</span>
          <span>Text</span>
        </button>
        <button className={styles.button} onClick={handleAddImage} title="Add Image">
          <span className={styles.icon}>+</span>
          <span>Image</span>
        </button>
      </div>

      <div className={styles.section}>
        <TemplateMenu />
      </div>

      <div className={styles.section}>
        <button className={styles.iconButton} onClick={zoomOut} title="Zoom Out">
          -
        </button>
        <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
        <button className={styles.iconButton} onClick={zoomIn} title="Zoom In">
          +
        </button>
        <button
          className={styles.iconButton}
          onClick={() => setZoom(1)}
          title="Reset Zoom"
        >
          100%
        </button>
      </div>
    </div>
  );
}
