import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortableCategoryGroupProps = {
  id: string;
  label: string;
  children: React.ReactNode;
};

export function SortableCategoryGroup({ id, label, children }: SortableCategoryGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      sx={{
        opacity: isDragging ? 0.72 : 1,
        borderRadius: 2.5,
        px: 1,
        py: 0.75,
        WebkitTapHighlightColor: 'transparent',
        transition: 'background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:hover': {
          backgroundColor: 'rgba(15, 106, 114, 0.06)',
          boxShadow: 'inset 0 0 0 1px rgba(15, 106, 114, 0.12)',
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          mb: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          cursor: 'grab',
          borderRadius: 2,
          px: 0.25,
          py: 0.25,
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          '&:active': {
            cursor: 'grabbing',
            transform: 'scale(0.995)',
          },
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '.02em',
            color: '#4d6c82',
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      </Box>

      {children}
    </Box>
  );
}
