import { useSelector, useDispatch } from 'react-redux';
import { setTheme, setColorScheme } from '@/store/slices/uiSlice';
import type { RootState } from '@/store';
import type { Theme, ColorScheme } from '@/types';

function useTheme() {
  const dispatch = useDispatch();
  const { theme, colorScheme } = useSelector((state: RootState) => state.ui);

  const changeTheme = (newTheme: Theme) => {
    dispatch(setTheme(newTheme));
    
    // Apply theme to document
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    
    // Update class for dark/light mode
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const changeColorScheme = (newColorScheme: ColorScheme) => {
    dispatch(setColorScheme(newColorScheme));
    
    // Apply color scheme to document
    const root = document.documentElement;
    root.setAttribute('data-color-scheme', newColorScheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  const isDarkMode = theme === 'dark';
  const isLightMode = theme === 'light';

  // System preference detection
  const getSystemTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const useSystemTheme = () => {
    const systemTheme = getSystemTheme();
    changeTheme(systemTheme);
  };

  return {
    theme,
    colorScheme,
    isDarkMode,
    isLightMode,
    changeTheme,
    changeColorScheme,
    toggleTheme,
    getSystemTheme,
    useSystemTheme,
  };
}

export default useTheme;
