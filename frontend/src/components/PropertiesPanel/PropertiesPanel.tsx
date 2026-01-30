import { useEditorStore, FRAME_ID } from '../../store/editorStore';
import { useSystemFonts } from '../../hooks/useSystemFonts';
import type { TextObject, HeroObject, CanvasObject } from '../../types/canvas';
import { ASPECT_RATIO_PRESETS } from '../../types/canvas';
import styles from './PropertiesPanel.module.css';

function FrameProperties() {
  const { frame, setFrame } = useEditorStore();

  const handleAspectRatioChange = (ratio: '1:1' | '4:3' | '16:9') => {
    const preset = ASPECT_RATIO_PRESETS[ratio];
    setFrame({
      aspectRatio: ratio,
      width: preset.width,
      height: preset.height,
    });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Frame</div>
      <div className={styles.field}>
        <label>Aspect Ratio</label>
        <div className={styles.buttonGroup}>
          {(['1:1', '4:3', '16:9'] as const).map((ratio) => (
            <button
              key={ratio}
              className={`${styles.ratioButton} ${frame.aspectRatio === ratio ? styles.active : ''}`}
              onClick={() => handleAspectRatioChange(ratio)}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Width</label>
          <input
            type="number"
            value={frame.width}
            onChange={(e) => setFrame({ width: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label>Height</label>
          <input
            type="number"
            value={frame.height}
            onChange={(e) => setFrame({ height: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label>Background Color</label>
        <input
          type="color"
          value={frame.backgroundColor}
          onChange={(e) => setFrame({ backgroundColor: e.target.value })}
          className={styles.colorInput}
        />
      </div>
    </div>
  );
}

function TransformProperties({ object }: { object: CanvasObject }) {
  const { updateObject } = useEditorStore();

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Transform</div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>X</label>
          <input
            type="number"
            value={Math.round(object.x)}
            onChange={(e) => updateObject(object.id, { x: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label>Y</label>
          <input
            type="number"
            value={Math.round(object.y)}
            onChange={(e) => updateObject(object.id, { y: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Width</label>
          <input
            type="number"
            value={Math.round(object.width)}
            onChange={(e) => updateObject(object.id, { width: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label>Height</label>
          <input
            type="number"
            value={Math.round(object.height)}
            onChange={(e) => updateObject(object.id, { height: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Rotation</label>
          <input
            type="number"
            value={Math.round(object.rotation)}
            onChange={(e) => updateObject(object.id, { rotation: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label>Opacity</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={object.opacity}
            onChange={(e) => updateObject(object.id, { opacity: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

function AlignmentProperties() {
  const { alignHorizontal, alignVertical } = useEditorStore();

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Alignment</div>
      <div className={styles.field}>
        <label>Horizontal</label>
        <div className={styles.alignmentGroup}>
          <button
            className={styles.alignButton}
            onClick={() => alignHorizontal('left')}
            title="Align Left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 22H2V2h2v20zM22 7H6v3h16V7zm-6 7H6v3h10v-3z" />
            </svg>
          </button>
          <button
            className={styles.alignButton}
            onClick={() => alignHorizontal('center')}
            title="Align Center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 2h2v5h8v3h-8v4h6v3h-6v5h-2v-5H5v-3h6v-4H3V7h8V2z" />
            </svg>
          </button>
          <button
            className={styles.alignButton}
            onClick={() => alignHorizontal('right')}
            title="Align Right"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2h2v20h-2V2zM2 7h16v3H2V7zm6 7h10v3H8v-3z" />
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.field}>
        <label>Vertical</label>
        <div className={styles.alignmentGroup}>
          <button
            className={styles.alignButton}
            onClick={() => alignVertical('top')}
            title="Align Top"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 2v2H2V2h20zM7 22V6h3v16H7zm7-6V6h3v10h-3z" />
            </svg>
          </button>
          <button
            className={styles.alignButton}
            onClick={() => alignVertical('middle')}
            title="Align Middle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 11v2h5v6h3v-6h4v8h3v-8h5v-2h-5V3h-3v8h-4V5H7v6H2z" />
            </svg>
          </button>
          <button
            className={styles.alignButton}
            onClick={() => alignVertical('bottom')}
            title="Align Bottom"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 22v-2H2v2h20zM7 2v16h3V2H7zm7 6v10h3V8h-3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroProperties({ object }: { object: HeroObject }) {
  const { openGalleryForReplacement } = useEditorStore();

  // Extract filename from path
  const fileName = object.originalPath.split('/').pop() || 'Unknown';

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Главное изображение</div>
      <div className={styles.field}>
        <label>Файл</label>
        <div className={styles.fileName} title={object.originalPath}>
          {fileName}
        </div>
      </div>
      <button className={styles.replaceButton} onClick={openGalleryForReplacement}>
        Заменить изображение
      </button>
    </div>
  );
}

function TextProperties({ object, fonts }: { object: TextObject; fonts: string[] }) {
  const { updateObject } = useEditorStore();

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Text</div>
      <div className={styles.field}>
        <label>Key</label>
        <input
          type="text"
          value={object.key}
          onChange={(e) => updateObject(object.id, { key: e.target.value })}
          placeholder="TEXT-1"
        />
      </div>
      <div className={styles.field}>
        <label>Content</label>
        <textarea
          value={object.content}
          onChange={(e) => updateObject(object.id, { content: e.target.value })}
          rows={3}
          className={styles.textarea}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Font Size</label>
          <input
            type="number"
            value={object.fontSize}
            onChange={(e) => updateObject(object.id, { fontSize: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label>Color</label>
          <input
            type="color"
            value={object.fill}
            onChange={(e) => updateObject(object.id, { fill: e.target.value })}
            className={styles.colorInput}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label>Font Family</label>
        <select
          value={object.fontFamily}
          onChange={(e) => updateObject(object.id, { fontFamily: e.target.value })}
        >
          {fonts.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Weight</label>
          <select
            value={object.fontWeight}
            onChange={(e) => updateObject(object.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Align</label>
          <select
            value={object.align}
            onChange={(e) => updateObject(object.id, { align: e.target.value as 'left' | 'center' | 'right' })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const { objects, selectedIds } = useEditorStore();
  const { fonts } = useSystemFonts();

  const isFrameSelected = selectedIds[0] === FRAME_ID;
  const selectedObject = selectedIds.length === 1 && !isFrameSelected
    ? objects.find((o) => o.id === selectedIds[0])
    : null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>Properties</div>
      <div className={styles.content}>
        {/* Frame is selected - show only Frame properties */}
        {isFrameSelected && <FrameProperties />}

        {/* Object is selected - show Alignment first, then other properties */}
        {selectedObject && (
          <>
            <AlignmentProperties />
            <TransformProperties object={selectedObject} />
            {selectedObject.type === 'hero' && (
              <HeroProperties object={selectedObject as HeroObject} />
            )}
            {selectedObject.type === 'text' && (
              <TextProperties object={selectedObject as TextObject} fonts={fonts} />
            )}
          </>
        )}

        {/* Nothing selected */}
        {selectedIds.length === 0 && (
          <div className={styles.hint}>
            Select an object to edit its properties
          </div>
        )}

        {/* Multiple objects selected */}
        {selectedIds.length > 1 && !isFrameSelected && (
          <div className={styles.hint}>
            {selectedIds.length} objects selected
          </div>
        )}
      </div>
    </div>
  );
}
