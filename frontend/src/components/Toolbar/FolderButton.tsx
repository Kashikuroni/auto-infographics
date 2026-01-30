import { useEditorStore } from '../../store/editorStore';
import styles from './FolderButton.module.css';

export function FolderButton() {
  const workingDirectoryName = useEditorStore((s) => s.workingDirectoryName);
  const openGalleryOverlay = useEditorStore((s) => s.openGalleryOverlay);

  if (!workingDirectoryName) return null;

  return (
    <button className={styles.folderButton} onClick={openGalleryOverlay}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
      <span className={styles.name}>{workingDirectoryName}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.chevron}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
