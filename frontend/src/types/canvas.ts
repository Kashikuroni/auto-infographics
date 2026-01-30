// Базовый тип для всех объектов на canvas
export interface BaseObject {
  id: string;
  type: 'hero' | 'background' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  name: string;
}

// Главное изображение инфографики (нельзя удалить, можно заменить)
export interface HeroObject extends BaseObject {
  type: 'hero';
  src: string;
  originalPath: string; // Путь к оригинальному файлу для замены
}

// Фоновое изображение
export interface BackgroundObject extends BaseObject {
  type: 'background';
  src: string;
  scaleMode: 'fill' | 'fit' | 'stretch';
}

// Текстовый блок
export interface TextObject extends BaseObject {
  type: 'text';
  key: string; // Уникальный ключ для маппинга данных (TEXT-1, TEXT-2, ...)
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  fill: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
}

// Дополнительное изображение (иконка)
export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
}

// Union тип для всех объектов
export type CanvasObject = HeroObject | BackgroundObject | TextObject | ImageObject;

// Настройки холста (Frame)
export interface FrameSettings {
  aspectRatio: '1:1' | '4:3' | '16:9' | 'custom';
  width: number;
  height: number;
  backgroundColor: string;
}

// Aspect ratio presets
export const ASPECT_RATIO_PRESETS = {
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1080, height: 810 },
  '16:9': { width: 1920, height: 1080 },
} as const;
