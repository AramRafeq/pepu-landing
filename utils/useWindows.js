import { useState, useEffect } from 'react';

const useWindowAvailable = () => {
  const [isWindowAvailable, setIsWindowAvailable] = useState(false);
  // const [isTabletView, setIsTabletView] = useState(false);

  useEffect(() => {
    // const { innerWidth } = window
    // const handleResize = () => {
    //   setIsTabletView(innerWidth < 992);
    // };

    // handleResize(); // Set initial value
    // window.addEventListener('resize', handleResize);

    setIsWindowAvailable(true);
  }, []);

  return {
    isWindowAvailable,
    // isTabletView,
  };
}

export default useWindowAvailable;