import { Dayjs } from "dayjs";

export type getAllInvoicesTypes = () => Promise<IInvoice[] | []>;
export type getUserInvoicesTypes = (uid: string) => Promise<IInvoice[] | []>;
export type getInvoiceTypes = (invoiceId: string) => Promise<IInvoice | null>;
export type updateInvoiceTypes = (invoice: IInvoice) => Promise<void>;
export type deleteInvoiceTypes = (invoiceId: string) => Promise<void>;

export type IInvoice = {
    addDate: Dayjs | null;
    addMonth: number;
    description: string;
    invoiceCategory: string;
    value: number | undefined;
    userId: string;
    id: string;
}