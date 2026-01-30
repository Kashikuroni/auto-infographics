import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ImageThumbnail } from './ImageThumbnail';
import styles from './GalleryView.module.css';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function GalleryView() {
  const {
    workingDirectoryName,
    allImages,
    selectedImagePaths,
    selectAllImages,
    deselectAllImages,
    proceedToEditor,
    setAppPhase,
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

  const handleBack = () => {
    setAppPhase('startup');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleBack}>
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={styles.title}>{workingDirectoryName}</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.count}>
            {selectedCount} of {allImages.length} selected
          </span>
          <button className={styles.controlButton} onClick={selectAllImages}>
            Select All
          </button>
          <button className={styles.controlButton} onClick={deselectAllImages}>
            Deselect All
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {paginatedImages.map((image) => (
          <ImageThumbnail
            key={image.path}
            image={image}
            isSelected={selectedImagePaths.has(image.path)}
          />
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <label className={styles.pageSizeLabel}>
            Per page:
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
                title="First page"
              >
                ⏮
              </button>
              <button
                className={styles.pageButton}
                onClick={goToPrev}
                disabled={currentPage === 1}
                title="Previous page"
              >
                ◀
              </button>
              <span className={styles.pageInfo}>
                Page
                <input
                  type="text"
                  className={styles.pageInput}
                  value={pageInputValue}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyDown={handlePageInputKeyDown}
                />
                of {totalPages}
              </span>
              <button
                className={styles.pageButton}
                onClick={goToNext}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                ▶
              </button>
              <button
                className={styles.pageButton}
                onClick={goToLast}
                disabled={currentPage === totalPages}
                title="Last page"
              >
                ⏭
              </button>
            </div>
          )}
        </div>

        <div className={styles.footerRight}>
          <button
            className={styles.proceedButton}
            onClick={proceedToEditor}
            disabled={selectedCount === 0}
          >
            Continue with {selectedCount} image{selectedCount !== 1 ? 's' : ''}
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
