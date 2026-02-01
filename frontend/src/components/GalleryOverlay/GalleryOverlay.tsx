import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useEditorStore, type ImageFile } from '../../store/editorStore';
import styles from './GalleryOverlay.module.css';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

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
    allImages,
    replaceHeroImage,
  } = useEditorStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageInputValue, setPageInputValue] = useState('1');

  const handleReplaceSelect = (image: ImageFile) => {
    replaceHeroImage(image.thumbnailUrl, image.path);
    closeGalleryOverlay();
  };

  const totalPages = Math.ceil(allImages.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedImages = allImages.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
    setPageInputValue('1');
  }, [pageSize]);

  useEffect(() => {
    if (isGalleryOverlayOpen) {
      setCurrentPage(1);
      setPageInputValue('1');
    }
  }, [isGalleryOverlayOpen]);

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
              Выберите изображение
            </Dialog.Title>
            <div className={styles.headerRight}>
              <span className={styles.count}>
                {allImages.length} изображений
              </span>
            </div>
          </div>

          <div className={styles.grid}>
            {paginatedImages.map((image) => (
              <ReplaceCard
                key={image.path}
                image={image}
                onSelect={() => handleReplaceSelect(image)}
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

            <div className={styles.footerRight}>
              <Dialog.Close asChild>
                <button className={styles.closeButton}>
                  Отмена
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
