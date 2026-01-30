import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import styles from './TemplateMenu.module.css';

export function TemplateMenu() {
  const {
    templates,
    fetchTemplates,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    workingDirectory,
  } = useEditorStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch templates when working directory changes
  useEffect(() => {
    if (workingDirectory) {
      fetchTemplates();
    }
  }, [workingDirectory, fetchTemplates]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsSaveDialogOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!newTemplateName.trim()) return;

    setIsLoading(true);
    try {
      await saveTemplate(newTemplateName.trim());
      setNewTemplateName('');
      setIsSaveDialogOpen(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (templatePath: string) => {
    setIsLoading(true);
    try {
      await loadTemplate(templatePath);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templatePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this template?')) return;

    try {
      await deleteTemplate(templatePath);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        disabled={!workingDirectory}
        title={workingDirectory ? 'Templates' : 'Select a folder first'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
        </svg>
        <span>Templates</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={styles.chevron}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {isSaveDialogOpen ? (
            <div className={styles.saveDialog}>
              <input
                type="text"
                placeholder="Template name..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
                className={styles.input}
              />
              <div className={styles.saveActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsSaveDialogOpen(false);
                    setNewTemplateName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={!newTemplateName.trim() || isLoading}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                className={styles.menuItem}
                onClick={() => setIsSaveDialogOpen(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 6h9v4H6V6z" />
                </svg>
                Save as Template...
              </button>

              {templates.length > 0 && (
                <>
                  <div className={styles.divider} />
                  <div className={styles.templatesList}>
                    {templates.map((template) => (
                      <div
                        key={template.path}
                        className={styles.templateItem}
                        onClick={() => handleLoad(template.path)}
                      >
                        <span className={styles.templateName}>{template.name}</span>
                        <button
                          className={styles.deleteButton}
                          onClick={(e) => handleDelete(template.path, e)}
                          title="Delete template"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {templates.length === 0 && (
                <div className={styles.emptyState}>No saved templates</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
