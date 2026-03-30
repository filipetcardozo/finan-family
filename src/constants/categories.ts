export type CategoryOption = {
  label: string;
  group?: string;
};

export const defaultExpenseCategories: CategoryOption[] = [
  { label: 'Supermercado', group: 'Alim. e Lazer' },
  { label: 'Delivery', group: 'Alim. e Lazer' },
  { label: 'Padaria', group: 'Alim. e Lazer' },
  { label: 'Restaurante', group: 'Alim. e Lazer' },
  { label: 'Distribuidora', group: 'Alim. e Lazer' },
  { label: 'Combustível', group: 'Gastos Veíc.' },
  { label: 'Lavagem automotiva', group: 'Gastos Veíc.' },
  { label: 'Manutenção do Veículo', group: 'Gastos Veíc.' },
  { label: 'Compra de peças para o veículo', group: 'Gastos Veíc.' },
  { label: 'Serviço de Transporte', group: 'Gastos Veíc.' },
  { label: 'Cuidados Pessoais', group: 'Despesas Comuns' },
  { label: 'Acessórios Pessoais', group: 'Despesas Comuns' },
  { label: 'Pets', group: 'Despesas Comuns' },
  { label: 'Vestuário', group: 'Despesas Comuns' },
  { label: 'Farmácia', group: 'Despesas Comuns' },
  { label: 'Saúde', group: 'Despesas Comuns' },
  { label: 'Assinaturas Digitais', group: 'Tec. e Estudo' },
  { label: 'Streaming de Vídeo', group: 'Tec. e Estudo' },
  { label: 'Educação', group: 'Tec. e Estudo' },
  { label: 'Eletrônicos', group: 'Tec. e Estudo' },
  { label: 'Aluguel', group: 'Casa' },
  { label: 'Contas', group: 'Casa' },
  { label: 'Reparos e Manutenção', group: 'Casa' },
  { label: 'Móveis e Decoração', group: 'Casa' },
  { label: 'Viagens', group: 'Lazer' },
  { label: 'Eventos', group: 'Lazer' },
  { label: 'Atividades Esportivas', group: 'Lazer' },
  { label: 'Atividades Recreativas', group: 'Lazer' },
  { label: 'Hobbies', group: 'Lazer' },
  { label: 'Presentes', group: 'Outras Pessoas' },
  { label: 'Transferência bancária', group: 'Outras Pessoas' },
  { label: 'Empréstimos', group: 'Outras Pessoas' },
  { label: 'Financiamento', group: 'Outras opções' },
  { label: 'Cartão de Crédito', group: 'Outras opções' },
  { label: 'Materiais e equipamentos genéricos', group: 'Outras opções' },
  { label: 'Investimentos', group: 'Outras opções' },
  { label: 'Outros', group: 'Outras opções' },
];

export const defaultRevenueCategories: CategoryOption[] = [
  { label: 'Salário' },
  { label: 'Freelancer' },
  { label: 'Empréstimos' },
  { label: 'Outros' },
];

export const normalizeCategoryLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

export const sanitizeCategoryOption = (category: Partial<CategoryOption>): CategoryOption | null => {
  const label = category.label?.trim();
  const group = category.group?.trim();

  if (!label) {
    return null;
  }

  return group ? { label, group } : { label };
};

export const sortCategoryOptions = (categories: CategoryOption[]) =>
  [...categories].sort((first, second) => {
    const firstGroup = first.group || '';
    const secondGroup = second.group || '';

    if (firstGroup !== secondGroup) {
      return firstGroup.localeCompare(secondGroup, 'pt-BR');
    }

    return first.label.localeCompare(second.label, 'pt-BR');
  });

export const dedupeCategoryOptions = (categories: Partial<CategoryOption>[] = []) => {
  const uniqueCategories = new Map<string, CategoryOption>();

  categories.forEach(category => {
    const sanitizedCategory = sanitizeCategoryOption(category);

    if (!sanitizedCategory) {
      return;
    }

    uniqueCategories.set(normalizeCategoryLabel(sanitizedCategory.label), sanitizedCategory);
  });

  return sortCategoryOptions(Array.from(uniqueCategories.values()));
};
