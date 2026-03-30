import { normalizeCategoryLabel } from '../constants/categories';

const normalizedGroupAliases = [
  {
    label: 'Alimentação e Lazer',
    aliases: ['Alim. e Lazer', 'Alimentação e Lazer'],
  },
  {
    label: 'Gastos com Veículo',
    aliases: ['Gastos Veíc.', 'Gastos com Veículo'],
  },
  {
    label: 'Tecnologia e Estudo',
    aliases: ['Tec. e Estudo', 'Tecnologia e Estudo'],
  },
];

export const normalizeCategoryGroup = (group?: string) => {
  const value = group?.trim();

  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeCategoryLabel(value);

  const aliasMatch = normalizedGroupAliases.find(({ aliases, label }) => {
    if (aliases.some(alias => normalizeCategoryLabel(alias) === normalizedValue)) {
      return true;
    }

    if (label === 'Gastos com Veículo' && normalizedValue.startsWith('gastos ve')) {
      return true;
    }

    return false;
  });

  return aliasMatch?.label || value;
};

export const getCategoryGroupLabel = (group?: string) => normalizeCategoryGroup(group) || '';
