import { Dayjs } from "dayjs";

export type getAllInvoicesTypes = () => Promise<IInvoice[] | []>

export type IInvoice = {
    addDate: Dayjs | null;
    addMonth: number;
    description: string;
    invoiceCategory: string;
    value: number | undefined;
    userId: string;
}