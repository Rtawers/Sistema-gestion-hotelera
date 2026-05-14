/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta del Hotel USS (puedes ajustarla despues)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // Estados de habitacion (colores del plano)
        estado: {
          disponible: '#10b981',   // verde
          ocupada: '#ef4444',      // rojo
          limpieza: '#f59e0b',     // amarillo
          mantenimiento: '#6b7280', // gris
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}