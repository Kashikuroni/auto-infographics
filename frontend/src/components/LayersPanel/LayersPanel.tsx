import { useEditorStore, FRAME_ID } from '../../store/editorStore';
import type { CanvasObject } from '../../types/canvas';
import styles from './LayersPanel.module.css';
import clsx from 'clsx';

// Special Frame layer item
function FrameLayerItem({ isSelected }: { isSelected: boolean }) {
  const { selectFrame } = useEditorStore();

  return (
    <div
      className={clsx(styles.layerItem, styles.frameItem, isSelected && styles.selected)}
      onClick={selectFrame}
    >
      <span className={styles.typeIcon}>F</span>
      <span className={styles.name}>Frame</span>
    </div>
  );
}

function LayerItem({
  object,
  isSelected,
}: {
  object: CanvasObject;
  isSelected: boolean;
}) {
  const { selectObject, updateObject, deleteObject } = useEditorStore();

  const handleClick = () => {
    selectObject(object.id);
  };

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateObject(object.id, { visible: !object.visible });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteObject(object.id);
  };

  const getTypeIcon = () => {
    switch (object.type) {
      case 'text':
        return 'T';
      case 'image':
        return 'I';
      case 'background':
        return 'B';
      case 'hero':
        return 'H';
      default:
        return '?';
    }
  };

  return (
    <div
      className={clsx(styles.layerItem, isSelected && styles.selected)}
      onClick={handleClick}
    >
      <span className={styles.typeIcon}>{getTypeIcon()}</span>
      <span className={styles.name}>{object.name}</span>
      <div className={styles.actions}>
        <button
          className={clsx(styles.actionButton, !object.visible && styles.hidden)}
          onClick={handleVisibilityToggle}
          title={object.visible ? 'Hide' : 'Show'}
        >
          {object.visible ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          )}
        </button>
        {/* Hero objects can't be deleted */}
        {object.type !== 'hero' && (
          <button
            className={styles.actionButton}
            onClick={handleDelete}
            title="Delete"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export function LayersPanel() {
  const { objects, selectedIds } = useEditorStore();

  // Reverse order - top layer first
  const reversedObjects = [...objects].reverse();
  const isFrameSelected = selectedIds[0] === FRAME_ID;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Layers</span>
        <span className={styles.count}>{objects.length + 1}</span>
      </div>
      <div className={styles.list}>
        {/* Frame is always at the top */}
        <FrameLayerItem isSelected={isFrameSelected} />

        {reversedObjects.length === 0 ? (
          <div className={styles.empty}>
            No objects yet.<br />
            Click "Text" or "Image" to add.
          </div>
        ) : (
          reversedObjects.map((obj) => (
            <LayerItem
              key={obj.id}
              object={obj}
              isSelected={selectedIds.includes(obj.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
