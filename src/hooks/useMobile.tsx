import { useContext } from 'react';
import { MobileContext } from '../contexts/isMobileContext';

const useMobile = () => {
  const context = useContext(MobileContext);

  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }

  return context;
};

export default useMobile;