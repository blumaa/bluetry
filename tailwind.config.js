/** @type {import('tailwindcss').Config} */
const mondTheme = require('@mond-design-system/theme');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      ...mondTheme,
      colors: {
        ...mondTheme.colors,
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...mondTheme.fontFamily?.sans || []],
        mono: ['var(--font-geist-mono)', ...mondTheme.fontFamily?.mono || []],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}