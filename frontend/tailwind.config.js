/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#18212f",
        mist: "#eef3f7",
        sea: "#0f766e",
        coral: "#e15c45",
        grape: "#6d5bd0",
      },
    },
  },
  plugins: [],
};
