import type { CategoryOption } from '../constants/categories';
import { normalizeCategoryLabel } from '../constants/categories';
import { normalizeCategoryGroup } from './categoryGroupLabels';

export const getCategoryId = (label: string) => normalizeCategoryLabel(label);
export const getCategoryGroupId = (group: string) => normalizeCategoryLabel(group);

export const dedupeCategoriesPreservingOrder = (categories: Partial<CategoryOption>[] = []) => {
  const uniqueCategories = new Map<string, CategoryOption>();

  categories.forEach(category => {
    const label = category.label?.trim();
    const group = normalizeCategoryGroup(category.group);

    if (!label) {
      return;
    }

    const normalizedLabel = getCategoryId(label);
    uniqueCategories.set(normalizedLabel, group ? { label, group } : { label });
  });

  return Array.from(uniqueCategories.values());
};

export const reorderCategories = (
  categories: CategoryOption[],
  activeId: string,
  overId: string,
) => {
  const activeIndex = categories.findIndex(category => getCategoryId(category.label) === activeId);
  const overIndex = categories.findIndex(category => getCategoryId(category.label) === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return categories;
  }

  const nextCategories = [...categories];
  const [movedCategory] = nextCategories.splice(activeIndex, 1);

  nextCategories.splice(overIndex, 0, movedCategory);

  return nextCategories;
};

export const reorderValues = (
  values: string[],
  activeId: string,
  overId: string,
) => {
  const activeIndex = values.findIndex(value => getCategoryGroupId(value) === activeId);
  const overIndex = values.findIndex(value => getCategoryGroupId(value) === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return values;
  }

  const nextValues = [...values];
  const [movedValue] = nextValues.splice(activeIndex, 1);

  nextValues.splice(overIndex, 0, movedValue);

  return nextValues;
};
