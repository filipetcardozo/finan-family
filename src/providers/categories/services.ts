import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dedupeCategoryOptions } from '../../constants/categories';
import { database } from '../../../firebaseConfig';
import type { UserCategoriesDocument } from './types';

const emptyUserCategories: UserCategoriesDocument = {
  expenseCategories: [],
  revenueCategories: [],
};

export const getUserCategories = async (uid: string): Promise<UserCategoriesDocument> => {
  if (!uid) {
    return emptyUserCategories;
  }

  const categoriesRef = doc(database, 'userSettings', uid);
  const categoriesSnapshot = await getDoc(categoriesRef);

  if (!categoriesSnapshot.exists()) {
    return emptyUserCategories;
  }

  const categoriesData = categoriesSnapshot.data() as Partial<UserCategoriesDocument>;

  return {
    expenseCategories: dedupeCategoryOptions(categoriesData.expenseCategories),
    revenueCategories: dedupeCategoryOptions(categoriesData.revenueCategories),
    updatedAt: categoriesData.updatedAt,
  };
};

export const saveUserCategories = async (uid: string, categories: UserCategoriesDocument) => {
  if (!uid) {
    return;
  }

  const categoriesRef = doc(database, 'userSettings', uid);

  await setDoc(
    categoriesRef,
    {
      ...categories,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};
