import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEditorStore } from '../../store/editorStore';
import type { TextObject, ImageObject } from '../../types/canvas';
import { BulkFillDialog } from './BulkFillDialog';
import styles from './TableTab.module.css';

interface GenerateResult {
  success: boolean;
  generated_files: string[];
  errors: string[];
}

interface GenerationProgress {
  current: number;
  total: number;
  current_file: string;
}

interface CpuInfo {
  logical_cores: number;
  physical_cores: number;
  recommended: number;
}

export function TableTab() {
  const {
    allImages,
    selectedImagePaths,
    objects,
    tableData,
    setTableTextValue,
    initializeTableData,
    workingDirectory,
    frame,
    currentTemplateName,
  } = useEditorStore();

  const [bulkFillKey, setBulkFillKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [cpuInfo, setCpuInfo] = useState<CpuInfo | null>(null);
  const [parallelism, setParallelism] = useState<number | null>(null);

  // Load CPU info on mount
  useEffect(() => {
    invoke<CpuInfo>('get_cpu_info').then((info) => {
      setCpuInfo(info);
      setParallelism(info.recommended); // Default to recommended
    });
  }, []);

  // Listen for progress events
  useEffect(() => {
    const unlisten = listen<GenerationProgress>('generation-progress', (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Get selected images in order
  const selectedImages = allImages.filter((img) => selectedImagePaths.has(img.path));

  // Get visible text and image objects for columns (hidden layers are excluded)
  const textObjects = objects.filter((o) => o.type === 'text' && o.visible) as TextObject[];
  const imageObjects = objects.filter((o) => o.type === 'image' && o.visible) as ImageObject[];

  // Initialize table data when component mounts or objects change
  useEffect(() => {
    initializeTableData();
  }, [objects, selectedImagePaths, initializeTableData]);

  const handleGenerate = async () => {
    if (!workingDirectory || selectedImages.length === 0) return;

    setIsGenerating(true);
    setGenerateResult(null);
    setProgress({ current: 0, total: selectedImages.length, current_file: '' });

    try {
      const result = await invoke<GenerateResult>('generate_infographics', {
        request: {
          workingDirectory,
          frame: {
            width: frame.width,
            height: frame.height,
            backgroundColor: frame.backgroundColor,
          },
          objects,
          tableData,
          selectedImages: selectedImages.map((img) => ({
            path: img.path,
            name: img.name,
          })),
          templateName: currentTemplateName,
          parallelism: parallelism,
        },
      });

      setGenerateResult(result);
    } catch (error) {
      setGenerateResult({
        success: false,
        generated_files: [],
        errors: [String(error)],
      });
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  if (selectedImages.length === 0) {
    return (
      <div className={styles.tableTab}>
        <div className={styles.placeholder}>
          <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" />
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
          </svg>
          <h2 className={styles.title}>Таблица</h2>
          <p className={styles.description}>
            Выберите изображения в галерее для работы с таблицей
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableTab}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.count}>
            {selectedImages.length} изображений
          </span>
        </div>
        <div className={styles.generateControls}>
          {cpuInfo && (
            <div className={styles.threadsControl}>
              <label className={styles.threadsLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="6" height="6" rx="1" />
                  <rect x="14" y="4" width="6" height="6" rx="1" />
                  <rect x="4" y="14" width="6" height="6" rx="1" />
                  <rect x="14" y="14" width="6" height="6" rx="1" />
                </svg>
                Потоков:
              </label>
              <select
                className={styles.threadsSelect}
                value={parallelism ?? cpuInfo.recommended}
                onChange={(e) => setParallelism(Number(e.target.value))}
                disabled={isGenerating}
              >
                {Array.from({ length: cpuInfo.logical_cores }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}{n === cpuInfo.recommended ? ' (рекомендуется)' : ''}
                    {n === cpuInfo.logical_cores ? ' (максимум)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            className={styles.generateButton}
            onClick={handleGenerate}
            disabled={isGenerating || selectedImages.length === 0}
          >
            {isGenerating ? (
              <>Генерация...</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Генерировать
              </>
            )}
          </button>
        </div>
      </div>

      {generateResult && (
        <div className={`${styles.resultBanner} ${generateResult.success ? styles.success : styles.error}`}>
          {generateResult.success ? (
            <span>
              Создано {generateResult.generated_files.length} инфографик в папке infographics/
              {currentTemplateName && <>{currentTemplateName}/</>}
            </span>
          ) : (
            <span>Ошибка: {generateResult.errors.join(', ')}</span>
          )}
          <button className={styles.closeBanner} onClick={() => setGenerateResult(null)}>×</button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Главное изображение</th>
              {imageObjects.map((img) => (
                <th key={img.id} className={styles.headerCell}>
                  {img.name}
                </th>
              ))}
              {textObjects.map((text) => (
                <th key={text.id} className={styles.headerCell}>
                  <div className={styles.textHeader}>
                    <span>{text.key}</span>
                    <button
                      className={styles.bulkFillButton}
                      onClick={() => setBulkFillKey(text.key)}
                      title="Заполнить массово"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedImages.map((image) => (
              <tr key={image.path}>
                <td className={styles.heroCell}>
                  <img
                    src={image.thumbnailUrl}
                    alt={image.name}
                    className={styles.heroImage}
                  />
                </td>
                {imageObjects.map((img) => (
                  <td key={img.id} className={styles.imageCell}>
                    <img
                      src={img.src}
                      alt={img.name}
                      className={styles.additionalImage}
                    />
                  </td>
                ))}
                {textObjects.map((text) => (
                  <td key={text.id} className={styles.textCell}>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={tableData[image.path]?.[text.key] || ''}
                      onChange={(e) =>
                        setTableTextValue(image.path, text.key, e.target.value)
                      }
                      placeholder={text.content}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bulkFillKey && (
        <BulkFillDialog
          textKey={bulkFillKey}
          onClose={() => setBulkFillKey(null)}
        />
      )}

      {isGenerating && progress && (
        <div className={styles.progressOverlay}>
          <div className={styles.progressModal}>
            <div className={styles.spinner} />
            <div className={styles.progressText}>
              Обработка {progress.current} из {progress.total}
            </div>
            <div className={styles.progressFile}>{progress.current_file}</div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
