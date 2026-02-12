import type { SxProps, Theme } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';
import type { CategoryOption } from './types';

export const expenseCategories: CategoryOption[] = [
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

export const revenueCategories: CategoryOption[] = [
  { label: 'Salário' },
  { label: 'Freelancer' },
  { label: 'Empréstimos' },
  { label: 'Outros' },
];

export const getDefaultAddDateBySelectedMonth = (dateToAnalyze: Dayjs): Dayjs => {
  if (dateToAnalyze.isAfter(dayjs(), 'month')) {
    return dateToAnalyze.startOf('month');
  }
  return dayjs(new Date());
};

export const secondaryActionSx: SxProps<Theme> = {
  color: '#2a4f64',
  borderColor: 'rgba(8, 43, 67, 0.22)',
  '&:hover': {
    borderColor: 'rgba(8, 43, 67, 0.42)',
    backgroundColor: 'rgba(8, 43, 67, 0.05)',
  },
};

export const primaryActionSx: SxProps<Theme> = {
  background: 'linear-gradient(136deg, #082b43 0%, #0f6a72 48%, #15917c 100%)',
  '&:hover': {
    background: 'linear-gradient(136deg, #0a3451 0%, #12747c 48%, #1aa188 100%)',
  },
};
