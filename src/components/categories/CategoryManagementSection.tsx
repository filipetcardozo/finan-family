import React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { CategoryOption } from '../../constants/categories';
import { getCategoryGroupId } from '../../utils/categoryCollections';
import { SortableCategoryChip } from './SortableCategoryChip';
import { SortableCategoryGroup } from './SortableCategoryGroup';

export type CategoryManagementItem = CategoryOption & {
  id: string;
  isCustom: boolean;
};

export type CategoryManagementGroup = {
  group: string;
  categories: CategoryManagementItem[];
};

type CategoryManagementSectionProps = {
  title: string;
  groups: CategoryManagementGroup[];
  emptyText: string;
  headerAction?: React.ReactNode;
  onAdd?(category: CategoryOption): void;
  onCreateInGroup?(group: string): void;
  onDelete?(label: string): void;
  onReorder?(activeId: string, overId: string): void | Promise<void>;
  onGroupReorder?(activeId: string, overId: string): void | Promise<void>;
};

export function CategoryManagementSection({
  title,
  groups,
  emptyText,
  headerAction,
  onAdd,
  onCreateInGroup,
  onDelete,
  onReorder,
  onGroupReorder,
}: CategoryManagementSectionProps) {
  const touchActivationConstraint = {
    delay: 180,
    tolerance: 8,
  };

  const groupSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: touchActivationConstraint,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const categorySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: touchActivationConstraint,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    if (!onReorder || !event.over) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = String(event.over.id);

    if (activeId === overId) {
      return;
    }

    onReorder(activeId, overId);
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    if (!onGroupReorder || !event.over) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = String(event.over.id);

    if (activeId === overId) {
      return;
    }

    onGroupReorder(activeId, overId);
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={1}>
        <Typography sx={{ fontWeight: 700, color: '#123047' }}>{title}</Typography>
        {headerAction}
      </Stack>

      {groups.length > 0 ? (
        <DndContext sensors={groupSensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
          <SortableContext
            items={groups.map(group => getCategoryGroupId(group.group))}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1.5}>
              {groups.map(group => {
                const customCategories = group.categories.filter(category => category.isCustom);
                const defaultCategories = group.categories.filter(category => !category.isCustom);

                return (
                  <SortableCategoryGroup
                    key={group.group}
                    id={getCategoryGroupId(group.group)}
                    label={group.group}
                  >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <DndContext
                        sensors={categorySensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleCategoryDragEnd}
                      >
                        <SortableContext
                          items={customCategories.map(category => category.id)}
                          strategy={rectSortingStrategy}
                        >
                          {customCategories.map(category => (
                            <SortableCategoryChip
                              key={category.id}
                              id={category.id}
                              label={category.label}
                              onDelete={onDelete ? () => onDelete(category.label) : undefined}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>

                      {defaultCategories.map(category => (
                        <Chip
                          key={category.id}
                          label={category.label}
                          variant='outlined'
                          icon={<AddRoundedIcon />}
                          onClick={onAdd ? () => onAdd(category) : undefined}
                          sx={{ borderRadius: 2 }}
                        />
                      ))}

                      <Button
                        variant='text'
                        size='small'
                        onClick={() => onCreateInGroup?.(group.group)}
                        sx={{
                          minWidth: 28,
                          width: 28,
                          height: 32,
                          p: 0,
                          color: '#0f6a72',
                          borderRadius: 1,
                          alignSelf: 'center',
                          '&:hover': {
                            backgroundColor: 'rgba(15, 106, 114, 0.08)',
                          },
                        }}
                      >
                        <AddCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </Button>
                    </Box>
                  </SortableCategoryGroup>
                );
              })}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : (
        <Typography sx={{ fontSize: 14, color: '#607d92' }}>{emptyText}</Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 0.5 }}>
        <Button
          variant='contained'
          startIcon={<AddCircleOutlineRoundedIcon />}
          onClick={() => onCreateInGroup?.('')}
          sx={{
            borderRadius: 999,
            px: 2,
            background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
          }}
        >
          Nova categoria
        </Button>
      </Box>
    </Stack>
  );
}
