import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Log environment variables during build
console.log('Building with environment variables:', {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]',
});

// Temporary hardcoded values for testing
const SUPABASE_URL = 'https://afvltpqnhmaxanirwnqz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdmx0cHFuaG1heGFuaXJ3bnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxMzg1NjEsImV4cCI6MjA1MDcxNDU2MX0.q9MFzNUClfCNflqYaKUpMip23RSvAEQVxtDx1AIGvAA';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  define: {
    // Ensure environment variables are properly stringified
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY),
  },
});