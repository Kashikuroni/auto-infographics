import { useEditorStore } from '../../store/editorStore';
import styles from './ZoomIndicator.module.css';

export function ZoomIndicator() {
  const zoom = useEditorStore((state) => state.zoom);

  return (
    <div className={styles.indicator}>
      {Math.round(zoom * 100)}%
    </div>
  );
}
