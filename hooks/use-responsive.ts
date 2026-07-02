import { Breakpoint } from '@/types/breakpoint';
import { useWindowDimensions } from 'react-native';


export function useResponsive() {
  const { width, height } = useWindowDimensions();
   
  const isTablet = width >= 768;
  const isDesktop = width >= 1024; 
  const isLandscape = width > height;
  
  let breakpoint: Breakpoint = 'phone';
  if (isDesktop) {
    breakpoint = 'desktop';
  } if (isTablet) {
    breakpoint = 'tablet';
  }

  return { 
    screenWidth: width,
    screenHeight: height,
    isTablet, 
    isDesktop, 
    isLandscape,
    breakpoint };

}
