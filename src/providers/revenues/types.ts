import { Dayjs } from "dayjs";

export type getUserRevenuesTypes = (uid: string, addDate: string) => Promise<IRevenue[] | []>;
export type getRevenueTypes = (RevenueId: string) => Promise<IRevenue | null>;
export type updateRevenueTypes = (Revenue: IRevenue) => Promise<void>;
export type deleteRevenueTypes = (RevenueId: string) => Promise<void>;

export type IRevenue = {
    addDate: Dayjs | null;
    addDateFormatted: string;
    description: string;
    revenueCategory: string;
    value: number | undefined;
    userId: string;
    id: string;
}