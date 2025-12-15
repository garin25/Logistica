// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- El cambio importante es aquí
    autoprefixer: {},
  },
}