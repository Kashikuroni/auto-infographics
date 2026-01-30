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
          {object.visible ? '👁' : '👁‍🗨'}
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
