import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LinkedIn-inspired color palette
        linkedin: {
          blue: '#0A66C2',
          'blue-dark': '#004182',
          'blue-light': '#378FE9',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // Status colors
        status: {
          applied: '#10B981',
          interview: '#F59E0B',
          shortlisted: '#8B5CF6',
          rejected: '#EF4444',
        },
        // Scheme colors
        scheme: {
          training: '#3B82F6',
          'non-training': '#6B7280',
        },
        // Deadline urgency
        deadline: {
          critical: '#DC2626', // < 48 hours
          warning: '#F59E0B', // < 7 days
          normal: '#10B981', // > 7 days
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'linkedin': '0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
