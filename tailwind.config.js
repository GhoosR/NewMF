/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'vegetable-plot-bg': "url('https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/vegfield.jpg')",
        'tree-plot-bg': "url('https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/treefield.webp')",
        'herb-plot-bg': "url('https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/herbfield.webp')",
        'flower-plot-bg': "url('https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/flowerfield.webp')",
        'water-plot-bg': "url('https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/waterfield.webp')",
        'fruit-plot-bg': "url('https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/fruitfield.webp')",
        'path-plot-bg': "url('https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/pathfield.webp')",
        // Add other plot type backgrounds if needed
      },
      colors: {
        background: '#ffffff',
        content: '#3C3C3C',
        accent: {
          base: '#ffffff',
          text: '#8da847'
        }
      },
      fontFamily: {
        gelica: ['Gelica', 'system-ui', 'sans-serif'],
        figtree: ['Figtree', 'system-ui', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      screens: {
        'xs': '375px',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-bottom))',
      },
      touchAction: {
        'manipulation': 'manipulation',
      }
    },
  },
  plugins: [],
};