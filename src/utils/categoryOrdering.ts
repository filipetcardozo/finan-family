import { normalizeCategoryLabel, type CategoryOption } from '../constants/categories';
import { getCategoryGroupLabel, normalizeCategoryGroup } from './categoryGroupLabels';

export type CategoryKind = 'expense' | 'revenue';

const expenseGroupOrder = [
  'Casa',
  'Alimentação e Lazer',
  'Despesas Comuns',
  'Gastos com Veículo',
  'Tecnologia e Estudo',
  'Lazer',
  'Outras Pessoas',
  'Outras opções',
];

const expenseItemOrder: Record<string, string[]> = {
  Casa: ['Aluguel', 'Contas', 'Reparos e Manutenção', 'Móveis e Decoração'],
  'Alimentação e Lazer': ['Supermercado', 'Padaria', 'Restaurante', 'Delivery', 'Distribuidora'],
  'Despesas Comuns': ['Saúde', 'Farmácia', 'Cuidados Pessoais', 'Pets', 'Vestuário', 'Acessórios Pessoais'],
  'Gastos com Veículo': [
    'Combustível',
    'Serviço de Transporte',
    'Manutenção do Veículo',
    'Lavagem automotiva',
    'Compra de peças para o veículo',
  ],
  'Tecnologia e Estudo': ['Assinaturas Digitais', 'Streaming de Vídeo', 'Educação', 'Eletrônicos'],
  Lazer: ['Atividades Esportivas', 'Eventos', 'Viagens', 'Atividades Recreativas', 'Hobbies'],
  'Outras Pessoas': ['Presentes', 'Transferência bancária', 'Empréstimos'],
  'Outras opções': ['Cartão de Crédito', 'Financiamento', 'Investimentos', 'Materiais e equipamentos genéricos', 'Outros'],
};

const revenueItemOrder = ['Salário', 'Freelancer', 'Outros', 'Empréstimos'];

const compareWithPriority = (first: string, second: string, priorityList: string[]) => {
  const normalizedFirst = normalizeCategoryLabel(first);
  const normalizedSecond = normalizeCategoryLabel(second);
  const normalizedPriorityList = priorityList.map(item => normalizeCategoryLabel(item));

  const firstIndex = normalizedPriorityList.indexOf(normalizedFirst);
  const secondIndex = normalizedPriorityList.indexOf(normalizedSecond);

  if (firstIndex !== -1 || secondIndex !== -1) {
    if (firstIndex === -1) {
      return 1;
    }

    if (secondIndex === -1) {
      return -1;
    }

    return firstIndex - secondIndex;
  }

  return first.localeCompare(second, 'pt-BR');
};

const getDefaultSortedGroups = (groups: string[], type: CategoryKind) => {
  if (type === 'revenue') {
    return [...groups].sort((first, second) => first.localeCompare(second, 'pt-BR'));
  }

  return [...groups].sort((first, second) =>
    compareWithPriority(getCategoryGroupLabel(first), getCategoryGroupLabel(second), expenseGroupOrder),
  );
};

export const sortGroupNamesByPriority = (
  groups: string[],
  type: CategoryKind,
  preferredOrder: string[] = [],
) => {
  const normalizedPreferredOrder = preferredOrder.map(group => normalizeCategoryLabel(group));
  const defaultSortedGroups = getDefaultSortedGroups(groups, type);

  return [...defaultSortedGroups].sort((first, second) => {
    const firstIndex = normalizedPreferredOrder.indexOf(normalizeCategoryLabel(first));
    const secondIndex = normalizedPreferredOrder.indexOf(normalizeCategoryLabel(second));

    if (firstIndex !== -1 || secondIndex !== -1) {
      if (firstIndex === -1) {
        return 1;
      }

      if (secondIndex === -1) {
        return -1;
      }

      return firstIndex - secondIndex;
    }

    return 0;
  });
};

export const sortCategoriesByPriority = <T extends CategoryOption>(categories: T[], type: CategoryKind) =>
  [...categories].sort((first, second) => {
    if (type === 'revenue') {
      return compareWithPriority(first.label, second.label, revenueItemOrder);
    }

    const firstGroup = getCategoryGroupLabel(first.group);
    const secondGroup = getCategoryGroupLabel(second.group);
    const groupComparison = compareWithPriority(firstGroup, secondGroup, expenseGroupOrder);

    if (groupComparison !== 0) {
      return groupComparison;
    }

    const groupPriority = expenseItemOrder[firstGroup] || [];
    return compareWithPriority(first.label, second.label, groupPriority);
  });

export const normalizeGroupOrder = (
  groups: string[] | undefined,
  categories: CategoryOption[],
  type: CategoryKind,
) => {
  const normalizedGroups = (groups || [])
    .map(group => normalizeCategoryGroup(group))
    .filter((group): group is string => Boolean(group));

  const availableGroups = Array.from(
    new Map(
      categories
        .map(category => getCategoryGroupLabel(category.group))
        .filter((group): group is string => Boolean(group))
        .map(group => [normalizeCategoryLabel(group), group]),
    ).values(),
  );

  const dedupedGroups = Array.from(
    new Map(normalizedGroups.map(group => [normalizeCategoryLabel(group), getCategoryGroupLabel(group)])).values(),
  ).filter(group => availableGroups.some(availableGroup => normalizeCategoryLabel(availableGroup) === normalizeCategoryLabel(group)));

  const missingGroups = availableGroups.filter(
    group => !dedupedGroups.some(orderedGroup => normalizeCategoryLabel(orderedGroup) === normalizeCategoryLabel(group)),
  );

  return [...dedupedGroups, ...sortGroupNamesByPriority(missingGroups, type)];
};

export const orderCategoriesByGroupPriority = <T extends CategoryOption>(
  categories: T[],
  type: CategoryKind,
  preferredGroupOrder: string[] = [],
) => {
  const categoriesByGroup = new Map<string, T[]>();

  categories.forEach(category => {
    const group = getCategoryGroupLabel(category.group) || 'Sem grupo';
    const groupCategories = categoriesByGroup.get(group) || [];

    groupCategories.push(category);
    categoriesByGroup.set(group, groupCategories);
  });

  const orderedGroupNames = sortGroupNamesByPriority(Array.from(categoriesByGroup.keys()), type, preferredGroupOrder);

  return orderedGroupNames.flatMap(group => categoriesByGroup.get(group) || []);
};

export const mergeCategoriesByUserOrder = (
  defaultCategories: CategoryOption[],
  customCategories: CategoryOption[],
  type: CategoryKind,
  preferredGroupOrder: string[] = [],
) => {
  const normalizedCustomLabels = new Set(customCategories.map(category => normalizeCategoryLabel(category.label)));

  const remainingDefaultCategories = sortCategoriesByPriority(
    defaultCategories.filter(category => !normalizedCustomLabels.has(normalizeCategoryLabel(category.label))),
    type,
  );

  return orderCategoriesByGroupPriority(
    [...orderCategoriesByGroupPriority(customCategories, type, preferredGroupOrder), ...remainingDefaultCategories],
    type,
    preferredGroupOrder,
  );
};
