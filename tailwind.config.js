/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brandBlue: {
          700: "#1E4BB8", // ticket blue
        },
      },
      borderRadius: {
        ticket: "18px",
      },
    },
  },
  plugins: [],
};
