import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { query, where } from "firebase/firestore";
import { database } from "../../../firebaseConfig";
import { deleteRevenueTypes, getRevenueTypes, getUserRevenuesTypes, IRevenue, updateRevenueTypes } from "./types";
import dayjs from 'dayjs';

export const getUserRevenues: getUserRevenuesTypes = async (uid: string, dateToAnalyze: string) => {
	const collectionRef = collection(database, 'revenues');
	const getQuery = query(collectionRef, where('userId', '==', uid), where('addDateFormatted', '==', dateToAnalyze));
	const data = await getDocs(getQuery)

	if (!data.empty) {
		let revenues: IRevenue[] = []

		data.forEach((doc) => {
			let revenue = doc.data();
			revenue.id = doc.id;
			revenue.addDate = dayjs(revenue.addDate)
			revenues.push(revenue as IRevenue);
		})

		return revenues;
	} else {
		return [];
	}
}

export const getRevenue: getRevenueTypes = async (revenueId: string) => {
	const docRef = doc(database, 's', revenueId);
	const data = await getDoc(docRef);

	if (data.exists()) {
		let revenue = data.data();
		revenue.id = data.id;
		revenue.addDate = dayjs(revenue.addDate);

		return revenue as IRevenue;
	} else {
		return null;
	}
}

export const updateRevenue: updateRevenueTypes = async (revenue: IRevenue) => {
	let newRevenues: any = { ...revenue }
	newRevenues.addDate = newRevenues.addDate?.toString()
	const docRef = doc(database, 'revenues', newRevenues.id);
	await updateDoc(docRef, newRevenues);
}

export const deleteRevenue: deleteRevenueTypes = async (revenueId: string) => {
	await deleteDoc(doc(database, "revenues", revenueId));
}


export async function putRevenue(revenue: IRevenue) {
	let newRevenues: any = { ...revenue }
	newRevenues.addDate = newRevenues.addDate?.toString()
	const docRef = await addDoc(collection(database, 'revenues'), newRevenues);
	return {
		...revenue, id: docRef.id
	};
}