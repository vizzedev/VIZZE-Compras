/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        fundo: 'var(--cor-fundo)',
        superficie: 'var(--cor-superficie)',
        texto: 'var(--cor-texto)',
        'texto-suave': 'var(--cor-texto-suave)',
        primaria: 'var(--cor-primaria)',
        'primaria-fundo': 'var(--cor-primaria-fundo)',
        borda: 'var(--cor-borda)',
        alerta: 'var(--cor-alerta)',
        'alerta-fundo': 'var(--cor-alerta-fundo)',
        erro: 'var(--cor-erro)',
        'erro-fundo': 'var(--cor-erro-fundo)',
        sucesso: 'var(--cor-sucesso)',
        'sucesso-fundo': 'var(--cor-sucesso-fundo)',
        'serie-1': 'var(--cor-serie-1)',
        'serie-2': 'var(--cor-serie-2)',
        'serie-3': 'var(--cor-serie-3)',
        'serie-4': 'var(--cor-serie-4)',
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(43,33,27,0.08), 0 1px 2px rgba(43,33,27,0.04)',
      },
    },
  },
  plugins: [],
};
