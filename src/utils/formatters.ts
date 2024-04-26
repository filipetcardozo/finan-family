export const formatterCurrency = (value: number) => {
    if (value) {
        return value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
    } else {
        return '-';
    }
}