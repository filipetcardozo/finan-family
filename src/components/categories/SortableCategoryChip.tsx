import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortableCategoryChipProps = {
  id: string;
  label: string;
  onDelete?(): void;
};

export function SortableCategoryChip({ id, label, onDelete }: SortableCategoryChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      sx={{
        display: 'inline-flex',
        opacity: isDragging ? 0.72 : 1,
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <Chip
        label={label}
        color='success'
        variant='filled'
        onDelete={onDelete}
        {...attributes}
        {...listeners}
        sx={{
          backgroundColor: 'var(--primary-soft)', color: 'var(--primary-text)',
          '& .MuiChip-deleteIcon': { color: 'inherit', opacity: 0.65, '&:hover': { color: 'inherit', opacity: 1 } },
          borderRadius: 2,
          cursor: 'grab',
          transition: 'background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
          touchAction: 'none',
          '&:hover': {
            backgroundColor: 'var(--secondary-soft)',
            boxShadow: 'var(--shadow)',
          },
          '&:active': {
            cursor: 'grabbing',
            transform: 'scale(0.985)',
          },
        }}
      />
    </Box>
  );
}
