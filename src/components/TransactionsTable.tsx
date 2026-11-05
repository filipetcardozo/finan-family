import React, { useMemo, useState } from 'react';
import {
  IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TableSortLabel, Tooltip, Typography,
} from '@mui/material';
import BorderColorIcon from '@mui/icons-material/BorderColorOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { IInvoice } from '../providers/invoices/types';
import type { IRevenue } from '../providers/revenues/types';
import { formatterCurrency } from '../utils/formatters';
import { PendingSyncChip } from './PendingSyncChip';

type SortField = 'category' | 'value' | 'addDate' | 'description';

const columns: { field: SortField; label: string; minWidth: number }[] = [
  { field: 'category', label: 'Categoria', minWidth: 170 },
  { field: 'value', label: 'Valor', minWidth: 130 },
  { field: 'addDate', label: 'Data', minWidth: 120 },
  { field: 'description', label: 'Descrição', minWidth: 180 },
];

interface TransactionsTableProps<T extends IInvoice | IRevenue> {
  entries: T[];
  title: string;
  noun: 'despesa' | 'receita';
  getCategory: (entry: T) => string;
  renderDate?: (entry: T) => React.ReactNode;
  dateSortValue?: (entry: T) => number;
  onEdit: (entry: T) => void;
  onDelete: (invoiceId: string) => void;
  canManage?: boolean;
}

export function TransactionsTable<T extends IInvoice | IRevenue>({ entries, title, noun, getCategory, renderDate, dateSortValue, onEdit, onDelete, canManage = true }: TransactionsTableProps<T>) {
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedEntries = useMemo(() => [...entries].sort((left, right) => {
    let comparison: number;
    if (sortField === 'value') {
      comparison = (left.value ?? 0) - (right.value ?? 0);
    } else if (sortField === 'addDate') {
      comparison = dateSortValue ? dateSortValue(left) - dateSortValue(right) : (left.addDate?.valueOf() ?? 0) - (right.addDate?.valueOf() ?? 0);
    } else if (sortField === 'category') {
      comparison = (getCategory(left) ?? '').localeCompare(getCategory(right) ?? '', 'pt-BR');
    } else {
      comparison = (left[sortField] ?? '').localeCompare(right[sortField] ?? '', 'pt-BR');
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  }), [entries, sortField, sortDirection, getCategory, dateSortValue]);

  const handleSort = (field: SortField) => {
    setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  return (
    <TableContainer sx={{ border: '1px solid var(--border)', borderRadius: 3 }}>
      <Table aria-label={title} sx={{ minWidth: 720 }}>
        <TableHead sx={{ backgroundColor: 'var(--subtle)' }}>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column.field}
                sortDirection={sortField === column.field ? sortDirection : false}
                sx={{ minWidth: column.minWidth, color: 'var(--text)', fontWeight: 600 }}
              >
                <TableSortLabel
                  active={sortField === column.field}
                  direction={sortField === column.field ? sortDirection : 'asc'}
                  onClick={() => handleSort(column.field)}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell sx={{ minWidth: 120, color: 'var(--text)', fontWeight: 600 }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ '& .MuiTableRow-root:nth-of-type(even)': { backgroundColor: 'var(--subtle)' } }}>
          {sortedEntries.map(entry => (
            <TableRow key={entry.id} hover={canManage && !entry.pendingSync}
              tabIndex={canManage && !entry.pendingSync ? 0 : undefined}
              aria-label={`Editar ${noun}: ${getCategory(entry)}${entry.description ? `, ${entry.description}` : ''}`}
              onClick={() => { if (canManage && !entry.pendingSync) onEdit(entry); }}
              onKeyDown={event => {
                if (event.target === event.currentTarget && canManage && !entry.pendingSync && ['Enter', ' '].includes(event.key)) {
                  event.preventDefault(); onEdit(entry);
                }
              }}
              sx={{ cursor: canManage && !entry.pendingSync ? 'pointer' : 'default', '&:focus-visible': { outline: '2px solid var(--primary)', outlineOffset: -2 } }}>
              <TableCell>
                <Stack spacing={0.6} alignItems='flex-start'>
                  <span>{getCategory(entry)}</span>
                  {entry.pendingSync && <PendingSyncChip />}
                </Stack>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, color: 'var(--primary-text)', whiteSpace: 'nowrap' }}>
                  {formatterCurrency(entry.value)}
                </Typography>
              </TableCell>
              <TableCell>
                {renderDate ? renderDate(entry) : entry.addDate?.format('DD/MM/YYYY') ?? '-'}
              </TableCell>
              <TableCell sx={{ overflowWrap: 'anywhere' }}>{entry.description}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={event => event.stopPropagation()}>
                <Tooltip title={entry.pendingSync || !canManage ? 'Aguarde a conexão e a sincronização para editar' : `Editar ${noun}`}>
                  <span><IconButton disabled={entry.pendingSync || !canManage} color='primary' aria-label={`Editar ${noun}`} onClick={() => onEdit(entry)}>
                    <BorderColorIcon fontSize='small' />
                  </IconButton></span>
                </Tooltip>
                <Tooltip title={entry.pendingSync || !canManage ? 'Aguarde a conexão e a sincronização para excluir' : `Excluir ${noun}`}>
                  <span><IconButton disabled={entry.pendingSync || !canManage} color='error' aria-label={`Excluir ${noun}`} onClick={() => onDelete(entry.id)}>
                    <DeleteOutlineIcon fontSize='small' />
                  </IconButton></span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {!sortedEntries.length && (
            <TableRow>
              <TableCell colSpan={5} align='center' sx={{ py: 4 }}>Nenhuma {noun} encontrada.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
