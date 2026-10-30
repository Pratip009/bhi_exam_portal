/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2F3170",
        dawn: "#F2A93B",
        sky: "#EAF0F7",
        paper: "#FFFFFF",
        right: "#1F7A52",
        wrong: "#B83A26",
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        sans: ["system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
