import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { nanoid } from 'nanoid';
import { invoke } from '@tauri-apps/api/core';
import type { CanvasObject, FrameSettings, TextObject, ImageObject, BackgroundObject, HeroObject } from '../types/canvas';

// Enable Map/Set support in Immer
enableMapSet();

export interface ImageFile {
  path: string;
  name: string;
  thumbnailUrl: string;
}

export type AppPhase = 'startup' | 'gallery' | 'editor';
export type GalleryMode = 'select' | 'replace';
export type HorizontalAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'middle' | 'bottom';

// Special ID for Frame selection
export const FRAME_ID = '__FRAME__';

export interface TemplateInfo {
  name: string;
  path: string;
  createdAt: string;
}

interface EditorState {
  // App phase
  appPhase: AppPhase;

  // Working directory
  workingDirectory: string | null;
  workingDirectoryName: string | null;

  // Images from directory
  allImages: ImageFile[];
  selectedImagePaths: Set<string>;

  // Gallery overlay
  isGalleryOverlayOpen: boolean;
  galleryMode: GalleryMode;

  // Frame settings
  frame: FrameSettings;

  // Objects on canvas
  objects: CanvasObject[];

  // Selection
  selectedIds: string[];

  // Zoom
  zoom: number;

  // Templates
  templates: TemplateInfo[];
}

interface EditorActions {
  // App phase
  setAppPhase: (phase: AppPhase) => void;

  // Working directory
  setWorkingDirectory: (path: string, name: string) => void;
  clearWorkingDirectory: () => void;

  // Images
  setAllImages: (images: ImageFile[]) => void;
  toggleImageSelection: (path: string) => void;
  selectAllImages: () => void;
  deselectAllImages: () => void;

  // Gallery overlay
  openGalleryOverlay: () => void;
  openGalleryForReplacement: () => void;
  closeGalleryOverlay: () => void;

  // Hero image replacement
  replaceHeroImage: (src: string, originalPath: string) => void;

  // Proceed to editor
  proceedToEditor: () => void;

  // Frame
  setFrame: (frame: Partial<FrameSettings>) => void;

  // Objects
  addText: (text?: Partial<TextObject>) => void;
  addImage: (src: string, name?: string) => void;
  setBackground: (src: string) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;

  // Selection
  selectObject: (id: string | null) => void;
  selectMultiple: (ids: string[]) => void;
  selectFrame: () => void;
  clearSelection: () => void;

  // Layers
  reorderObjects: (fromIndex: number, toIndex: number) => void;
  moveToFront: (id: string) => void;
  moveToBack: (id: string) => void;

  // Alignment
  alignHorizontal: (alignment: HorizontalAlignment) => void;
  alignVertical: (alignment: VerticalAlignment) => void;

  // Zoom
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToView: (containerWidth: number, containerHeight: number) => void;

  // Reset
  resetEditor: () => void;

  // Templates
  fetchTemplates: () => Promise<void>;
  saveTemplate: (name: string) => Promise<void>;
  loadTemplate: (templatePath: string) => Promise<void>;
  deleteTemplate: (templatePath: string) => Promise<void>;
}

const defaultFrame: FrameSettings = {
  aspectRatio: '1:1',
  width: 1080,
  height: 1080,
  backgroundColor: '#ffffff',
};

const defaultTextObject: Omit<TextObject, 'id' | 'name' | 'key'> = {
  type: 'text',
  x: 100,
  y: 100,
  width: 200,
  height: 50,
  rotation: 0,
  opacity: 1,
  locked: false,
  visible: true,
  content: 'New Text',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 32,
  fontWeight: 'normal',
  fontStyle: 'normal',
  fill: '#000000',
  align: 'left',
  verticalAlign: 'top',
  lineHeight: 1.2,
};

export const useEditorStore = create<EditorState & EditorActions>()(
  immer((set, get) => ({
    // Initial state
    appPhase: 'startup' as AppPhase,
    workingDirectory: null,
    workingDirectoryName: null,
    allImages: [],
    selectedImagePaths: new Set<string>(),
    isGalleryOverlayOpen: false,
    galleryMode: 'select' as GalleryMode,
    frame: defaultFrame,
    objects: [],
    selectedIds: [],
    zoom: 1,
    templates: [],

    // App phase actions
    setAppPhase: (phase) =>
      set((state) => {
        state.appPhase = phase;
      }),

    // Working directory actions
    setWorkingDirectory: (path, name) =>
      set((state) => {
        state.workingDirectory = path;
        state.workingDirectoryName = name;
      }),

    clearWorkingDirectory: () =>
      set((state) => {
        state.workingDirectory = null;
        state.workingDirectoryName = null;
        state.allImages = [];
        state.selectedImagePaths = new Set();
      }),

    // Image actions
    setAllImages: (images) =>
      set((state) => {
        state.allImages = images;
        // Select all by default
        state.selectedImagePaths = new Set(images.map((img) => img.path));
      }),

    toggleImageSelection: (path) =>
      set((state) => {
        const newSet = new Set(state.selectedImagePaths);
        if (newSet.has(path)) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }
        state.selectedImagePaths = newSet;
      }),

    selectAllImages: () =>
      set((state) => {
        state.selectedImagePaths = new Set(state.allImages.map((img) => img.path));
      }),

    deselectAllImages: () =>
      set((state) => {
        state.selectedImagePaths = new Set();
      }),

    // Gallery overlay actions
    openGalleryOverlay: () =>
      set((state) => {
        state.galleryMode = 'select';
        state.isGalleryOverlayOpen = true;
      }),

    openGalleryForReplacement: () =>
      set((state) => {
        state.galleryMode = 'replace';
        state.isGalleryOverlayOpen = true;
      }),

    closeGalleryOverlay: () =>
      set((state) => {
        state.isGalleryOverlayOpen = false;
      }),

    // Hero image replacement
    replaceHeroImage: (src, originalPath) =>
      set((state) => {
        const heroIndex = state.objects.findIndex((o) => o.type === 'hero');
        if (heroIndex !== -1) {
          const hero = state.objects[heroIndex] as HeroObject;
          hero.src = src;
          hero.originalPath = originalPath;
        }
      }),

    // Proceed to editor
    proceedToEditor: () =>
      set((state) => {
        // Set first selected image as hero
        const firstSelected = state.allImages.find((img) =>
          state.selectedImagePaths.has(img.path)
        );
        if (firstSelected) {
          // Remove existing hero if any
          state.objects = state.objects.filter((o) => o.type !== 'hero');

          const id = nanoid();
          const hero: HeroObject = {
            id,
            type: 'hero',
            x: 0,
            y: 0,
            width: state.frame.width,
            height: state.frame.height,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            name: 'Главное изображение',
            src: firstSelected.thumbnailUrl,
            originalPath: firstSelected.path,
          };
          state.objects.unshift(hero);
        }
        state.appPhase = 'editor';
      }),

    // Frame actions
    setFrame: (updates) =>
      set((state) => {
        Object.assign(state.frame, updates);
      }),

    // Object actions
    addText: (text) =>
      set((state) => {
        const id = nanoid();
        const existingTexts = state.objects.filter((o) => o.type === 'text').length;
        const keyNumber = existingTexts + 1;
        const newText: TextObject = {
          ...defaultTextObject,
          ...text,
          id,
          key: text?.key || `TEXT-${keyNumber}`,
          name: `Text ${keyNumber}`,
        };
        state.objects.push(newText);
        state.selectedIds = [id];
      }),

    addImage: (src, name) =>
      set((state) => {
        const id = nanoid();
        const existingImages = state.objects.filter((o) => o.type === 'image').length;
        const newImage: ImageObject = {
          id,
          type: 'image',
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          name: name || `Image ${existingImages + 1}`,
          src,
        };
        state.objects.push(newImage);
        state.selectedIds = [id];
      }),

    setBackground: (src) =>
      set((state) => {
        // Remove existing background
        state.objects = state.objects.filter((o) => o.type !== 'background');

        const id = nanoid();
        const bg: BackgroundObject = {
          id,
          type: 'background',
          x: 0,
          y: 0,
          width: state.frame.width,
          height: state.frame.height,
          rotation: 0,
          opacity: 1,
          locked: true,
          visible: true,
          name: 'Background',
          src,
          scaleMode: 'fill',
        };
        // Insert at beginning (bottom layer)
        state.objects.unshift(bg);
      }),

    updateObject: (id, updates) =>
      set((state) => {
        const index = state.objects.findIndex((o) => o.id === id);
        if (index !== -1) {
          Object.assign(state.objects[index], updates);
        }
      }),

    deleteObject: (id) =>
      set((state) => {
        // Hero objects cannot be deleted
        const obj = state.objects.find((o) => o.id === id);
        if (obj?.type === 'hero') return;

        state.objects = state.objects.filter((o) => o.id !== id);
        state.selectedIds = state.selectedIds.filter((i) => i !== id);
      }),

    duplicateObject: (id) =>
      set((state) => {
        const obj = state.objects.find((o) => o.id === id);
        if (obj) {
          const newId = nanoid();
          const duplicate = {
            ...obj,
            id: newId,
            name: `${obj.name} copy`,
            x: obj.x + 20,
            y: obj.y + 20,
          };
          // Generate new key for text objects
          if (obj.type === 'text') {
            const existingTexts = state.objects.filter((o) => o.type === 'text').length;
            (duplicate as TextObject).key = `TEXT-${existingTexts + 1}`;
          }
          state.objects.push(duplicate);
          state.selectedIds = [newId];
        }
      }),

    // Selection actions
    selectObject: (id) =>
      set((state) => {
        state.selectedIds = id ? [id] : [];
      }),

    selectMultiple: (ids) =>
      set((state) => {
        state.selectedIds = ids;
      }),

    selectFrame: () =>
      set((state) => {
        state.selectedIds = [FRAME_ID];
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedIds = [];
      }),

    // Layer actions
    reorderObjects: (fromIndex, toIndex) =>
      set((state) => {
        const [removed] = state.objects.splice(fromIndex, 1);
        state.objects.splice(toIndex, 0, removed);
      }),

    moveToFront: (id) =>
      set((state) => {
        const index = state.objects.findIndex((o) => o.id === id);
        if (index !== -1 && index < state.objects.length - 1) {
          const [obj] = state.objects.splice(index, 1);
          state.objects.push(obj);
        }
      }),

    moveToBack: (id) =>
      set((state) => {
        const index = state.objects.findIndex((o) => o.id === id);
        if (index > 0) {
          const [obj] = state.objects.splice(index, 1);
          state.objects.unshift(obj);
        }
      }),

    // Alignment actions
    alignHorizontal: (alignment) =>
      set((state) => {
        for (const id of state.selectedIds) {
          const obj = state.objects.find((o) => o.id === id);
          if (!obj || obj.locked) continue;

          let newX: number;
          switch (alignment) {
            case 'left':
              newX = 0;
              break;
            case 'center':
              newX = (state.frame.width - obj.width) / 2;
              break;
            case 'right':
              newX = state.frame.width - obj.width;
              break;
          }
          obj.x = Math.round(newX);
        }
      }),

    alignVertical: (alignment) =>
      set((state) => {
        for (const id of state.selectedIds) {
          const obj = state.objects.find((o) => o.id === id);
          if (!obj || obj.locked) continue;

          let newY: number;
          switch (alignment) {
            case 'top':
              newY = 0;
              break;
            case 'middle':
              newY = (state.frame.height - obj.height) / 2;
              break;
            case 'bottom':
              newY = state.frame.height - obj.height;
              break;
          }
          obj.y = Math.round(newY);
        }
      }),

    // Zoom actions
    setZoom: (zoom) =>
      set((state) => {
        state.zoom = Math.max(0.1, Math.min(3, zoom));
      }),

    zoomIn: () =>
      set((state) => {
        state.zoom = Math.min(3, state.zoom + 0.1);
      }),

    zoomOut: () =>
      set((state) => {
        state.zoom = Math.max(0.1, state.zoom - 0.1);
      }),

    fitToView: (containerWidth, containerHeight) =>
      set((state) => {
        const padding = 80;
        const availableWidth = containerWidth - padding;
        const availableHeight = containerHeight - padding;

        const scaleX = availableWidth / state.frame.width;
        const scaleY = availableHeight / state.frame.height;

        // Не больше 100%, но можно меньше чтобы поместилось
        state.zoom = Math.min(scaleX, scaleY, 1);
      }),

    // Reset
    resetEditor: () =>
      set((state) => {
        state.frame = defaultFrame;
        state.objects = [];
        state.selectedIds = [];
        state.zoom = 1;
      }),

    // Template actions
    fetchTemplates: async () => {
      const state = get();
      if (!state.workingDirectory) return;

      try {
        const templates = await invoke<TemplateInfo[]>('list_templates', {
          workingDirectory: state.workingDirectory,
        });
        set((s) => {
          s.templates = templates.map((t) => ({
            name: t.name,
            path: t.path,
            createdAt: t.createdAt,
          }));
        });
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    },

    saveTemplate: async (name) => {
      const state = get();
      if (!state.workingDirectory) return;

      const templateData = {
        version: 1,
        name,
        createdAt: new Date().toISOString(),
        frame: state.frame,
        objects: state.objects,
      };

      try {
        await invoke('save_template', {
          workingDirectory: state.workingDirectory,
          name,
          templateData: JSON.stringify(templateData),
        });
        await get().fetchTemplates();
      } catch (error) {
        console.error('Failed to save template:', error);
        throw error;
      }
    },

    loadTemplate: async (templatePath) => {
      try {
        const json = await invoke<string>('load_template', { templatePath });
        const template = JSON.parse(json);

        set((state) => {
          state.frame = template.frame;
          state.objects = template.objects;
          state.selectedIds = [];
        });
      } catch (error) {
        console.error('Failed to load template:', error);
        throw error;
      }
    },

    deleteTemplate: async (templatePath) => {
      try {
        await invoke('delete_template', { templatePath });
        await get().fetchTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
        throw error;
      }
    },
  }))
);
