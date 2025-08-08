/** @type {import('tailwindcss').Config} */
const { tokens } = require('@mond-design-system/theme');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Use design system tokens directly
        ...tokens.colors,
        
        // Semantic color mappings for consistency with existing usage
        // These will be handled by components using the design token hook
        background: tokens.colors.background,
        foreground: tokens.colors.foreground,
        
        // Add semantic UI colors that components expect
        muted: {
          DEFAULT: tokens.colors.neutral[100],
          foreground: tokens.colors.neutral[500],
        },
        card: tokens.colors.background,
        border: tokens.colors.neutral[200],
        input: tokens.colors.neutral[100],
        ring: tokens.colors.primary[500],
      },
      fontFamily: {
        sans: [tokens.fontFamilies.sans],
        serif: [tokens.fontFamilies.serif],
        mono: [tokens.fontFamilies.mono],
      },
      fontSize: tokens.fontSizes,
      fontWeight: tokens.fontWeights,
      lineHeight: tokens.lineHeights,
      letterSpacing: tokens.letterSpacings,
      spacing: tokens.spacing,
      borderRadius: tokens.radii,
      boxShadow: tokens.shadows,
    },
  },
  plugins: [],
  darkMode: 'class', // Keep class-based dark mode for theme switching
}