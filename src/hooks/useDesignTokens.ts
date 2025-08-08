import { useTheme } from '@/contexts/ThemeContext';
import { tokens } from '@mond-design-system/theme';

type Theme = 'light' | 'dark';

/**
 * Theme-aware design tokens hook
 * Provides access to Mond Design System tokens with theme-specific overrides
 */
export function useDesignTokens() {
  const { theme } = useTheme();

  // Create theme-aware color mappings
  const getThemeColor = (lightColor: string, darkColor: string) => {
    return theme === 'dark' ? darkColor : lightColor;
  };

  // Semantic color mappings using design system tokens
  const colors = {
    // Background colors
    background: getThemeColor(tokens.colors.background.light, tokens.colors.background.dark),
    foreground: getThemeColor(tokens.colors.foreground.light, tokens.colors.foreground.dark),
    
    // Primary colors (theme-independent)
    primary: {
      50: tokens.colors.primary[50],
      100: tokens.colors.primary[100],
      200: tokens.colors.primary[200],
      300: tokens.colors.primary[300],
      400: tokens.colors.primary[400],
      500: tokens.colors.primary[500],
      600: tokens.colors.primary[600],
      700: tokens.colors.primary[700],
      800: tokens.colors.primary[800],
      900: tokens.colors.primary[900],
      DEFAULT: tokens.colors.primary[500],
    },
    
    // Neutral colors with theme awareness
    neutral: {
      50: getThemeColor(tokens.colors.neutral[50], tokens.colors.neutral[900]),
      100: getThemeColor(tokens.colors.neutral[100], tokens.colors.neutral[800]),
      200: getThemeColor(tokens.colors.neutral[200], tokens.colors.neutral[700]),
      300: getThemeColor(tokens.colors.neutral[300], tokens.colors.neutral[600]),
      400: getThemeColor(tokens.colors.neutral[400], tokens.colors.neutral[500]),
      500: getThemeColor(tokens.colors.neutral[500], tokens.colors.neutral[400]),
      600: getThemeColor(tokens.colors.neutral[600], tokens.colors.neutral[300]),
      700: getThemeColor(tokens.colors.neutral[700], tokens.colors.neutral[200]),
      800: getThemeColor(tokens.colors.neutral[800], tokens.colors.neutral[100]),
      900: getThemeColor(tokens.colors.neutral[900], tokens.colors.neutral[50]),
    },
    
    // Semantic UI colors
    muted: getThemeColor(tokens.colors.neutral[100], tokens.colors.neutral[700]),
    mutedForeground: getThemeColor(tokens.colors.neutral[500], tokens.colors.neutral[400]),
    
    card: getThemeColor(tokens.colors.background.light, tokens.colors.background.dark),
    cardForeground: getThemeColor(tokens.colors.foreground.light, tokens.colors.foreground.dark),
    
    border: getThemeColor(tokens.colors.neutral[200], tokens.colors.neutral[600]),
    input: getThemeColor(tokens.colors.neutral[100], tokens.colors.neutral[700]),
    
    accent: getThemeColor(tokens.colors.neutral[50], tokens.colors.neutral[800]),
    accentForeground: getThemeColor(tokens.colors.neutral[600], tokens.colors.neutral[300]),
    
    secondary: getThemeColor(tokens.colors.neutral[50], tokens.colors.neutral[800]),
    secondaryForeground: getThemeColor(tokens.colors.neutral[600], tokens.colors.neutral[300]),
    
    // Status colors (theme-independent)
    success: tokens.colors.success[500],
    warning: tokens.colors.warning[500],
    error: tokens.colors.error[500],
  };

  // Return both theme-aware colors and original tokens
  return {
    theme,
    colors,
    spacing: tokens.spacing,
    fontFamilies: tokens.fontFamilies,
    fontSizes: tokens.fontSizes,
    fontWeights: tokens.fontWeights,
    lineHeights: tokens.lineHeights,
    letterSpacings: tokens.letterSpacings,
    radii: tokens.radii,
    shadows: tokens.shadows,
    tokens, // Access to raw tokens if needed
  };
}

/**
 * Utility function to get theme-conditional Tailwind classes
 */
export function useThemeClasses() {
  const { theme } = useTheme();
  
  return {
    background: theme === 'dark' ? 'bg-[#27374D]' : 'bg-[#F2F3F4]',
    foreground: theme === 'dark' ? 'text-[#DDE6ED]' : 'text-[#414A4C]',
    
    card: theme === 'dark' ? 'bg-[#27374D]' : 'bg-[#F2F3F4]',
    cardForeground: theme === 'dark' ? 'text-[#DDE6ED]' : 'text-[#414A4C]',
    
    muted: theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-100',
    mutedForeground: theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500',
    
    border: theme === 'dark' ? 'border-neutral-600' : 'border-neutral-200',
    input: theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-100',
    
    accent: theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-50',
    accentForeground: theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600',
    
    // Helper for conditional classes
    conditional: (lightClass: string, darkClass: string) => 
      theme === 'dark' ? darkClass : lightClass,
  };
}