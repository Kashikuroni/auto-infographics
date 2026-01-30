import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const DEFAULT_FONTS = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Monaco',
  'SF Pro',
  'Roboto',
];

export function useSystemFonts() {
  const [fonts, setFonts] = useState<string[]>(DEFAULT_FONTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<string[]>('get_system_fonts')
      .then((systemFonts) => {
        if (systemFonts && systemFonts.length > 0) {
          setFonts(systemFonts);
        }
      })
      .catch((err) => {
        console.warn('Failed to load system fonts:', err);
        // Keep default fonts
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { fonts, loading };
}
