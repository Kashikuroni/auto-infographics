import { useEditorStore, type ImageFile } from '../../store/editorStore';
import styles from './ImageThumbnail.module.css';

interface ImageThumbnailProps {
  image: ImageFile;
  isSelected: boolean;
}

export function ImageThumbnail({ image, isSelected }: ImageThumbnailProps) {
  const { toggleImageSelection } = useEditorStore();

  const handleClick = () => {
    toggleImageSelection(image.path);
  };

  return (
    <div
      className={`${styles.thumbnail} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
    >
      <div className={styles.imageWrapper}>
        <img
          src={image.thumbnailUrl}
          alt={image.name}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.checkbox}>
          {isSelected ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          ) : null}
        </div>
      </div>
      <div className={styles.name} title={image.name} onClick={(e) => e.stopPropagation()}>
        {image.name}
      </div>
    </div>
  );
}
