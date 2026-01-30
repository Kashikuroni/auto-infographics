import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useEditorStore, type ImageFile } from '../../store/editorStore';
import { ImageThumbnail } from '../GalleryView/ImageThumbnail';
import styles from './GalleryOverlay.module.css';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

// Simple card for replace mode (no checkbox)
function ReplaceCard({ image, onSelect }: { image: ImageFile; onSelect: () => void }) {
  return (
    <div className={styles.replaceCard} onClick={onSelect}>
      <div className={styles.replaceImageWrapper}>
        <img
          src={image.thumbnailUrl}
          alt={image.name}
          className={styles.replaceImage}
          loading="lazy"
        />
      </div>
      <div className={styles.replaceName} title={image.name}>
        {image.name}
      </div>
    </div>
  );
}

export function GalleryOverlay() {
  const {
    isGalleryOverlayOpen,
    closeGalleryOverlay,
    workingDirectoryName,
    allImages,
    selectedImagePaths,
    selectAllImages,
    deselectAllImages,
    galleryMode,
    replaceHeroImage,
  } = useEditorStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageInputValue, setPageInputValue] = useState('1');

  const selectedCount = selectedImagePaths.size;
  const isReplaceMode = galleryMode === 'replace';

  const handleReplaceSelect = (image: ImageFile) => {
    replaceHeroImage(image.thumbnailUrl, image.path);
    closeGalleryOverlay();
  };
  const totalPages = Math.ceil(allImages.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedImages = allImages.slice(startIndex, endIndex);

  // Reset page when pageSize changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInputValue('1');
  }, [pageSize]);

  // Reset when overlay opens
  useEffect(() => {
    if (isGalleryOverlayOpen) {
      setCurrentPage(1);
      setPageInputValue('1');
    }
  }, [isGalleryOverlayOpen]);

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
    <Dialog.Root open={isGalleryOverlayOpen} onOpenChange={(open) => !open && closeGalleryOverlay()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>
              {isReplaceMode ? 'Выберите изображение' : workingDirectoryName}
            </Dialog.Title>
            {!isReplaceMode && (
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
            )}
            {isReplaceMode && (
              <div className={styles.headerRight}>
                <span className={styles.count}>
                  {allImages.length} изображений
                </span>
              </div>
            )}
          </div>

          <div className={styles.grid}>
            {isReplaceMode
              ? paginatedImages.map((image) => (
                  <ReplaceCard
                    key={image.path}
                    image={image}
                    onSelect={() => handleReplaceSelect(image)}
                  />
                ))
              : paginatedImages.map((image) => (
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
              <Dialog.Close asChild>
                <button className={styles.closeButton}>
                  {isReplaceMode ? 'Отмена' : 'Done'}
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
