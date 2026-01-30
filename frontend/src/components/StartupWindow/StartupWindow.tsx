import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useEditorStore, type ImageFile } from '../../store/editorStore';
import styles from './StartupWindow.module.css';

interface ImageFileInfo {
  path: string;
  name: string;
}

export function StartupWindow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setWorkingDirectory, setAllImages, setAppPhase } = useEditorStore();

  const handleSelectFolder = async () => {
    try {
      setLoading(true);
      setError(null);

      const directory = await open({
        directory: true,
        multiple: false,
        title: 'Select Working Directory',
      });

      if (!directory) {
        setLoading(false);
        return;
      }

      // Get images from directory via Tauri command
      const images = await invoke<ImageFileInfo[]>('list_images_in_directory', {
        directory,
      });

      if (images.length === 0) {
        setError('No images found in the selected directory');
        setLoading(false);
        return;
      }

      // Convert to ImageFile format with asset URLs
      const imageFiles: ImageFile[] = images.map((img) => ({
        path: img.path,
        name: img.name,
        thumbnailUrl: convertFileSrc(img.path),
      }));

      // Extract folder name from path
      const folderName = directory.split('/').pop() || directory;

      setWorkingDirectory(directory, folderName);
      setAllImages(imageFiles);
      setAppPhase('gallery');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h1 className={styles.title}>Infographics</h1>
        <p className={styles.subtitle}>
          Select a folder with images to start creating infographics
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.button}
          onClick={handleSelectFolder}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Choose Folder
            </>
          )}
        </button>

        <p className={styles.hint}>
          Supported formats: JPG, PNG, GIF, WebP, BMP, SVG
        </p>
      </div>
    </div>
  );
}
