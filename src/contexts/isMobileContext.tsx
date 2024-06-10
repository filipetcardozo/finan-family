import { createContext, useEffect, useState } from 'react';

type IMobileContextType = {
  isMobile: boolean;
};

export const MobileContext = createContext<IMobileContextType>({
  isMobile: false
});

type MobileProviderProps = {
  children: React.ReactNode;
};

export const MobileProvider = ({ children }: MobileProviderProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
};
