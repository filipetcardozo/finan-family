import { normalizeCategoryLabel, type CategoryOption } from '../constants/categories';
import { getCategoryGroupLabel } from './categoryGroupLabels';
import {
  mergeCategoriesByUserOrder,
  sortGroupNamesByPriority,
  type CategoryKind,
} from './categoryOrdering';

type UsageMetric = {
  label: string;
  count: number;
};

type BuildCategoryOptimizationParams = {
  type: CategoryKind;
  defaultCategories: CategoryOption[];
  customCategories: CategoryOption[];
  currentGroupOrder: string[];
  historyCategoryLabels: string[];
  fallbackGroup: string;
};

export type CategoryOptimizationResult = {
  totalEntries: number;
  suggestedGroupOrder: string[];
  suggestedCategories: CategoryOption[];
  unusedCustomLabels: string[];
  topGroups: UsageMetric[];
  topCategories: UsageMetric[];
};

const sortUsageMetrics = (
  metrics: UsageMetric[],
  fallbackOrder: string[],
) =>
  [...metrics].sort((first, second) => {
    if (first.count !== second.count) {
      return second.count - first.count;
    }

    const firstIndex = fallbackOrder.indexOf(first.label);
    const secondIndex = fallbackOrder.indexOf(second.label);

    if (firstIndex !== -1 || secondIndex !== -1) {
      if (firstIndex === -1) {
        return 1;
      }

      if (secondIndex === -1) {
        return -1;
      }

      return firstIndex - secondIndex;
    }

    return first.label.localeCompare(second.label, 'pt-BR');
  });

export const buildCategoryOptimization = ({
  type,
  defaultCategories,
  customCategories,
  currentGroupOrder,
  historyCategoryLabels,
  fallbackGroup,
}: BuildCategoryOptimizationParams): CategoryOptimizationResult => {
  const visibleCategories = mergeCategoriesByUserOrder(
    defaultCategories,
    customCategories,
    type,
    currentGroupOrder,
  );

  const categoryToGroup = new Map<string, string>();
  visibleCategories.forEach(category => {
    categoryToGroup.set(
      normalizeCategoryLabel(category.label),
      getCategoryGroupLabel(category.group) || fallbackGroup,
    );
  });

  const categoryCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();

  historyCategoryLabels.forEach(label => {
    const normalizedLabel = normalizeCategoryLabel(label);
    const group = categoryToGroup.get(normalizedLabel);

    categoryCounts.set(normalizedLabel, (categoryCounts.get(normalizedLabel) || 0) + 1);

    if (group) {
      groupCounts.set(group, (groupCounts.get(group) || 0) + 1);
    }
  });

  const visibleGroups = Array.from(
    new Map(
      visibleCategories.map(category => {
        const group = getCategoryGroupLabel(category.group) || fallbackGroup;
        return [normalizeCategoryLabel(group), group] as const;
      }),
    ).values(),
  );

  const groupFallbackOrder = sortGroupNamesByPriority(visibleGroups, type, currentGroupOrder);
  const topGroups = sortUsageMetrics(
    visibleGroups.map(group => ({
      label: group,
      count: groupCounts.get(group) || 0,
    })),
    groupFallbackOrder,
  );

  const suggestedGroupOrder = topGroups.map(group => group.label);

  const customCategoryFallbackOrder = customCategories.map(category => category.label);
  const topCategories = sortUsageMetrics(
    customCategories.map(category => ({
      label: category.label,
      count: categoryCounts.get(normalizeCategoryLabel(category.label)) || 0,
    })),
    customCategoryFallbackOrder,
  );

  const groupOrderIndex = new Map(
    suggestedGroupOrder.map((group, index) => [normalizeCategoryLabel(group), index]),
  );
  const customOrderIndex = new Map(
    customCategories.map((category, index) => [normalizeCategoryLabel(category.label), index]),
  );

  const suggestedCategories = [...customCategories].sort((first, second) => {
    const firstGroup = getCategoryGroupLabel(first.group) || fallbackGroup;
    const secondGroup = getCategoryGroupLabel(second.group) || fallbackGroup;
    const firstGroupIndex = groupOrderIndex.get(normalizeCategoryLabel(firstGroup)) ?? Number.MAX_SAFE_INTEGER;
    const secondGroupIndex = groupOrderIndex.get(normalizeCategoryLabel(secondGroup)) ?? Number.MAX_SAFE_INTEGER;

    if (firstGroupIndex !== secondGroupIndex) {
      return firstGroupIndex - secondGroupIndex;
    }

    const firstCount = categoryCounts.get(normalizeCategoryLabel(first.label)) || 0;
    const secondCount = categoryCounts.get(normalizeCategoryLabel(second.label)) || 0;

    if (firstCount !== secondCount) {
      return secondCount - firstCount;
    }

    return (
      (customOrderIndex.get(normalizeCategoryLabel(first.label)) ?? Number.MAX_SAFE_INTEGER) -
      (customOrderIndex.get(normalizeCategoryLabel(second.label)) ?? Number.MAX_SAFE_INTEGER)
    );
  });

  const unusedCustomLabels = customCategories
    .filter(category => !categoryCounts.has(normalizeCategoryLabel(category.label)))
    .map(category => category.label);

  return {
    totalEntries: historyCategoryLabels.length,
    suggestedGroupOrder,
    suggestedCategories,
    unusedCustomLabels,
    topGroups: topGroups.filter(group => group.count > 0),
    topCategories: topCategories.filter(category => category.count > 0),
  };
};
