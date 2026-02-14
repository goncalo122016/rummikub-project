export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rummikub: {
          tile: "#F6F1E7",
          tileBorder: "#D4CFC4",
          red: "#C0392B",
          blue: "#1E6FD9",
          black: "#2C2C2C",
          yellow: "#F1C40F",
          joker: "#6C3483",
        },
      },
    },
  },
  plugins: [],
}
