import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ImageThumbnail } from '../GalleryView/ImageThumbnail';
import styles from './GalleryTab.module.css';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function GalleryTab() {
  const {
    workingDirectoryName,
    allImages,
    selectedImagePaths,
    selectAllImages,
    deselectAllImages,
  } = useEditorStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageInputValue, setPageInputValue] = useState('1');

  const selectedCount = selectedImagePaths.size;

  const totalPages = Math.ceil(allImages.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedImages = allImages.slice(startIndex, endIndex);

  // Reset page when pageSize changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInputValue('1');
  }, [pageSize]);

  // Sync input with currentPage
  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const goToFirst = () => setCurrentPage(1);
  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goToLast = () => setCurrentPage(totalPages);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  return (
    <div className={styles.galleryTab}>
      <div className={styles.header}>
        <h2 className={styles.title}>{workingDirectoryName}</h2>
        <div className={styles.headerRight}>
          <span className={styles.count}>
            {selectedCount} из {allImages.length} выбрано
          </span>
          <button className={styles.controlButton} onClick={selectAllImages}>
            Выбрать все
          </button>
          <button className={styles.controlButton} onClick={deselectAllImages}>
            Снять выбор
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {paginatedImages.map((image) => (
          <ImageThumbnail
            key={image.path}
            image={image}
            isSelected={selectedImagePaths.has(image.path)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <label className={styles.pageSizeLabel}>
            На странице:
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.footerCenter}>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={goToFirst}
                disabled={currentPage === 1}
                title="Первая страница"
              >
                ⏮
              </button>
              <button
                className={styles.pageButton}
                onClick={goToPrev}
                disabled={currentPage === 1}
                title="Предыдущая"
              >
                ◀
              </button>
              <span className={styles.pageInfo}>
                Страница
                <input
                  type="text"
                  className={styles.pageInput}
                  value={pageInputValue}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyDown={handlePageInputKeyDown}
                />
                из {totalPages}
              </span>
              <button
                className={styles.pageButton}
                onClick={goToNext}
                disabled={currentPage === totalPages}
                title="Следующая"
              >
                ▶
              </button>
              <button
                className={styles.pageButton}
                onClick={goToLast}
                disabled={currentPage === totalPages}
                title="Последняя страница"
              >
                ⏭
              </button>
            </div>
          )}
        </div>

        <div className={styles.footerRight} />
      </div>
    </div>
  );
}
