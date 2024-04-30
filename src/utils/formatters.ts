export const formatterCurrency = (value: any) => {
  if (typeof value === 'number') {
    return value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
  } else {
    return '-';
  }
}