/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': [
          'Inter',
          'system-ui',
          'Pretendard',
          '-apple-system', 
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Open Sans',
          'Helvetica Neue',
          'sans-serif'
        ],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'hero-mobile': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'section-title': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'card-title': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-large': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-medium': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      colors: {
        primary: '#ff7e97',        // pink
        secondary: '#e6678a',      // darker pink
        background: '#F9FAFB',     // gray-50
        surface: '#FFFFFF',        // white
        'text-primary': '#111827', // gray-900
        'text-secondary': '#6B7280', // gray-500
        border: '#D1D5DB',         // gray-300
        accent: '#ff7e97',         // pink
        danger: '#EF4444',         // red-500
        'window-fill': '#ffeef2',  // light pink
        'window-stroke': '#ff7e97', // pink
        'accent-dark': '#cc5577',  // dark pink
        'danger-dark': '#DC2626',  // red-600
      },
    },
  },
  plugins: [],
};
