import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Transformer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import type { CanvasObject, TextObject, ImageObject, BackgroundObject, HeroObject } from '../../types/canvas';
import { ZoomIndicator } from './ZoomIndicator';
import styles from './Canvas.module.css';
import useImage from 'use-image';

// Helper component for loading images
function CanvasImage({
  src,
  commonProps,
  width,
  height,
  scaleMode,
}: {
  src: string;
  commonProps: Record<string, unknown>;
  width: number;
  height: number;
  scaleMode: 'fill' | 'fit' | 'stretch';
}) {
  const [image] = useImage(src, 'anonymous');

  if (!image) {
    // Show placeholder while loading
    return (
      <Rect
        {...commonProps}
        width={width}
        height={height}
        fill="#e5e5e5"
      />
    );
  }

  const baseX = (commonProps.x as number) || 0;
  const baseY = (commonProps.y as number) || 0;

  if (scaleMode === 'fill') {
    // Cover the entire area, cropping if necessary
    const imageRatio = image.width / image.height;
    const targetRatio = width / height;

    let cropX = 0;
    let cropY = 0;
    let cropWidth = image.width;
    let cropHeight = image.height;

    if (imageRatio > targetRatio) {
      // Image is wider - crop sides
      cropWidth = image.height * targetRatio;
      cropX = (image.width - cropWidth) / 2;
    } else {
      // Image is taller - crop top/bottom
      cropHeight = image.width / targetRatio;
      cropY = (image.height - cropHeight) / 2;
    }

    return (
      <KonvaImage
        {...commonProps}
        image={image}
        width={width}
        height={height}
        crop={{ x: cropX, y: cropY, width: cropWidth, height: cropHeight }}
      />
    );
  } else if (scaleMode === 'fit') {
    // Fit inside the given width/height, maintaining aspect ratio
    // Note: x, y, width, height should already be calculated correctly when creating the object
    // We just need to render the image scaled to fit those dimensions
    const imageRatio = image.width / image.height;
    const targetRatio = width / height;

    let renderWidth: number;
    let renderHeight: number;

    if (imageRatio > targetRatio) {
      renderWidth = width;
      renderHeight = width / imageRatio;
    } else {
      renderHeight = height;
      renderWidth = height * imageRatio;
    }

    return (
      <KonvaImage
        {...commonProps}
        image={image}
        width={renderWidth}
        height={renderHeight}
      />
    );
  } else {
    // stretch - fill entire area, ignoring aspect ratio
    return (
      <KonvaImage
        {...commonProps}
        image={image}
        width={width}
        height={height}
      />
    );
  }
}

export function Canvas() {
  const {
    frame,
    objects,
    selectedIds,
    zoom,
    selectObject,
    selectFrame,
    clearSelection,
    updateObject,
    setZoom,
    fitToView,
  } = useEditorStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fit to view on mount
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      fitToView(width, height);
    }
  }, [fitToView]);

  // Handle wheel zoom (mouse wheel + trackpad pinch)
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const scaleBy = 1.08;
      const oldScale = zoom;

      // deltaY < 0 = zoom in, deltaY > 0 = zoom out
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      setZoom(newScale);
    },
    [zoom, setZoom]
  );

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Click on empty space (stage) selects Frame
      if (e.target === e.target.getStage()) {
        selectFrame();
      }
    },
    [selectFrame]
  );

  const handleFrameClick = useCallback(() => {
    selectFrame();
  }, [selectFrame]);

  const handleSelect = useCallback(
    (id: string) => {
      selectObject(id);
    },
    [selectObject]
  );

  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>, obj: CanvasObject) => {
      const node = e.target;
      // Node position is at center (due to offset), convert back to top-left
      const offsetX = obj.width / 2;
      const offsetY = obj.height / 2;
      updateObject(id, {
        x: Math.round(node.x() - offsetX),
        y: Math.round(node.y() - offsetY),
      });
    },
    [updateObject]
  );

  const handleTransformEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<Event>, obj: CanvasObject) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Calculate new dimensions
      const newWidth = Math.round(Math.max(5, obj.width * scaleX));
      const newHeight = Math.round(Math.max(5, obj.height * scaleY));

      // The node's position is at the center point
      // After resize, offset changes, so we need to recalculate top-left
      const newOffsetX = newWidth / 2;
      const newOffsetY = newHeight / 2;

      // Reset scale
      node.scaleX(1);
      node.scaleY(1);

      updateObject(id, {
        x: Math.round(node.x() - newOffsetX),
        y: Math.round(node.y() - newOffsetY),
        width: newWidth,
        height: newHeight,
        rotation: Math.round(node.rotation()),
      });
    },
    [updateObject]
  );

  const renderObject = (obj: CanvasObject) => {
    if (!obj.visible) return null;

    // Calculate offset for center-based rotation
    const offsetX = obj.width / 2;
    const offsetY = obj.height / 2;

    const commonProps = {
      id: obj.id,
      // Position is top-left corner, but with offset it becomes the center point
      x: obj.x + offsetX,
      y: obj.y + offsetY,
      offsetX,
      offsetY,
      rotation: obj.rotation,
      opacity: obj.opacity,
      draggable: !obj.locked,
      onClick: () => handleSelect(obj.id),
      onTap: () => handleSelect(obj.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(obj.id, e, obj),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(obj.id, e, obj),
    };

    switch (obj.type) {
      case 'text': {
        const textObj = obj as TextObject;
        return (
          <Text
            key={obj.id}
            {...commonProps}
            text={textObj.content}
            fontSize={textObj.fontSize}
            fontFamily={textObj.fontFamily}
            fontStyle={`${textObj.fontWeight} ${textObj.fontStyle}`}
            fill={textObj.fill}
            align={textObj.align}
            verticalAlign={textObj.verticalAlign}
            width={textObj.width}
            lineHeight={textObj.lineHeight}
          />
        );
      }
      case 'hero': {
        const heroObj = obj as HeroObject;
        return (
          <CanvasImage
            key={obj.id}
            src={heroObj.src}
            commonProps={commonProps}
            width={obj.width}
            height={obj.height}
            scaleMode="fit"
          />
        );
      }
      case 'image':
      case 'background': {
        const imgObj = obj as ImageObject | BackgroundObject;
        return (
          <CanvasImage
            key={obj.id}
            src={imgObj.src}
            commonProps={commonProps}
            width={obj.width}
            height={obj.height}
            scaleMode={'scaleMode' in imgObj ? imgObj.scaleMode : 'fit'}
          />
        );
      }
      default:
        return null;
    }
  };

  const canvasWidth = frame.width * zoom;
  const canvasHeight = frame.height * zoom;

  return (
    <div ref={containerRef} className={styles.canvasWrapper}>
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={canvasHeight}
        scaleX={zoom}
        scaleY={zoom}
        onClick={handleStageClick}
        onWheel={handleWheel}
        className={styles.stage}
      >
        <Layer>
          {/* Frame background - clickable to select Frame */}
          <Rect
            x={0}
            y={0}
            width={frame.width}
            height={frame.height}
            fill={frame.backgroundColor}
            onClick={handleFrameClick}
            onTap={handleFrameClick}
          />

          {/* Render all objects */}
          {objects.map(renderObject)}

          {/* Selection transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit minimum size
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            anchorSize={8}
            anchorCornerRadius={2}
            borderStroke="#0d99ff"
            anchorStroke="#0d99ff"
            anchorFill="#ffffff"
          />
        </Layer>
      </Stage>
      <ZoomIndicator />
    </div>
  );
}
