import { useEditorStore, type EditorTab } from '../../store/editorStore';
import styles from './TabBar.module.css';

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'gallery', label: 'Галерея' },
  { id: 'editor', label: 'Редактор' },
  { id: 'table', label: 'Таблица' },
];

export function TabBar() {
  const activeTab = useEditorStore((state) => state.activeTab);
  const setActiveTab = useEditorStore((state) => state.setActiveTab);
  const currentTemplateName = useEditorStore((state) => state.currentTemplateName);
  const clearCurrentTemplate = useEditorStore((state) => state.clearCurrentTemplate);

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentTemplateName && (
        <div className={styles.templateIndicator}>
          <span className={styles.templateLabel}>Текущий шаблон:</span>
          <span className={styles.templateName}>{currentTemplateName}</span>
          <button
            className={styles.detachButton}
            onClick={clearCurrentTemplate}
            title="Отвязать от шаблона"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
