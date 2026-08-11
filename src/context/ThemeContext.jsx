import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

// EON is dark-mode only now — no light theme, no toggle, no stored
// preference to read. The `theme`/`setTheme`/`toggleTheme` shape is kept
// so any existing consumer code doesn't need to change, but setTheme/
// toggleTheme are now no-ops and theme is always 'dark'.
export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark', setTheme: () => {}, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
