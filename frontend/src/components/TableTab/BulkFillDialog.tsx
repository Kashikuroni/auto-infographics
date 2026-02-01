import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useEditorStore } from '../../store/editorStore';
import styles from './BulkFillDialog.module.css';

interface BulkFillDialogProps {
  textKey: string;
  onClose: () => void;
}

export function BulkFillDialog({ textKey, onClose }: BulkFillDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const setTableTextColumn = useEditorStore((s) => s.setTableTextColumn);
  const selectedImagePaths = useEditorStore((s) => s.selectedImagePaths);

  const handleApply = () => {
    // Split by newlines to get individual values
    const values = inputValue
      .split('\n')
      .map((v) => v.trim());

    setTableTextColumn(textKey, values);
    onClose();
  };

  const rowCount = selectedImagePaths.size;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>
            Заполнить массово: {textKey}
          </Dialog.Title>

          <p className={styles.description}>
            Вставьте значения из Excel (каждое значение на новой строке).
            <br />
            Всего строк в таблице: <strong>{rowCount}</strong>
          </p>

          <textarea
            className={styles.textarea}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Значение 1\nЗначение 2\nЗначение 3\n...`}
            rows={10}
            autoFocus
          />

          <div className={styles.footer}>
            <button className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button
              className={styles.applyButton}
              onClick={handleApply}
              disabled={!inputValue.trim()}
            >
              Применить
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
