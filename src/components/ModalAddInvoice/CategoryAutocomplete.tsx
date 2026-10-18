import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Autocomplete, FormControl, TextField } from '@mui/material';
import type { CategoryOption } from './types';

interface CategoryAutocompleteProps {
  options: CategoryOption[];
  value: string;
  onChange(value: string): void;
  groupBy?: (option: CategoryOption) => string;
  onOpen?(): void;
}

export function CategoryAutocomplete({ options, value, onChange, groupBy, onOpen }: CategoryAutocompleteProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef<number | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const scrollToCategory = useCallback((smooth = true) => {
    if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
    // Wait for the dialog's top alignment before scrolling its actual container.
    scrollFrame.current = window.requestAnimationFrame(() => {
      scrollFrame.current = null;
      if (!fieldRef.current?.isConnected) return;
      fieldRef.current.scrollIntoView({
        block: 'start', inline: 'nearest',
        behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto',
      });
    });
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    // The phone keyboard changes the visible area after the initial focus.
    const viewport = window.visualViewport;
    const realign = () => scrollToCategory(false);
    viewport?.addEventListener('resize', realign);
    window.addEventListener('resize', realign);
    return () => {
      viewport?.removeEventListener('resize', realign);
      window.removeEventListener('resize', realign);
    };
  }, [popupOpen, scrollToCategory]);

  useEffect(() => () => {
    if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
  }, []);

  return (
    <FormControl ref={fieldRef} fullWidth size="small" sx={{ scrollMarginTop: 12 }}>
      <Autocomplete<CategoryOption, false, false, false>
        openOnFocus
        onOpen={() => {
          onOpen?.();
          setPopupOpen(true);
          scrollToCategory();
        }}
        onClose={() => {
          setPopupOpen(false);
          if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
          scrollFrame.current = null;
        }}
        options={options}
        getOptionLabel={(option) => option.label}
        groupBy={groupBy}
        isOptionEqualToValue={(option, selected) => option.label === selected.label}
        renderInput={(params) => (
          <TextField {...params} label="Categoria" variant="outlined" size="small" />
        )}
        onChange={(_event, selectedValue) => onChange(selectedValue ? selectedValue.label : '')}
        value={options.find((option) => option.label === value) || null}
      />
    </FormControl>
  );
}
