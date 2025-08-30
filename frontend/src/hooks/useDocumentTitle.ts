import { useEffect, useRef } from 'react';

interface UseDocumentTitleOptions {
  suffix?: string;
  restoreOnUnmount?: boolean;
}

function useDocumentTitle(
  title: string,
  options: UseDocumentTitleOptions = {}
) {
  const {
    suffix = 'School Management System',
    restoreOnUnmount = true,
  } = options;

  const prevTitleRef = useRef<string>();

  useEffect(() => {
    // Store the previous title on first render
    if (prevTitleRef.current === undefined) {
      prevTitleRef.current = document.title;
    }

    // Set the new title
    const fullTitle = title ? `${title} | ${suffix}` : suffix;
    document.title = fullTitle;

    // Cleanup function to restore the previous title
    return () => {
      if (restoreOnUnmount && prevTitleRef.current) {
        document.title = prevTitleRef.current;
      }
    };
  }, [title, suffix, restoreOnUnmount]);

  // Return a function to manually update the title
  const updateTitle = (newTitle: string) => {
    const fullTitle = newTitle ? `${newTitle} | ${suffix}` : suffix;
    document.title = fullTitle;
  };

  return { updateTitle };
}

export default useDocumentTitle;
