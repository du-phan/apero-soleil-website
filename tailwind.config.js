/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors - Warm amber for sunlit areas
        primary: "#F9A825",
        "primary-light": "#FFD54F",
        "primary-dark": "#F57F17",

        // Secondary colors - Cool slate blue for shaded areas
        secondary: "#607D8B",
        "secondary-light": "#B0BEC5",
        "secondary-dark": "#455A64",

        // Accent - Vibrant coral for interactive elements
        accent: "#FF5252",
        "accent-light": "#FF8A80",
        "accent-dark": "#D50000",

        // Background colors
        background: "#FFFFFF",
        "background-alt": "#F5F7FA",

        // Text colors
        text: "#1A2C42",
        "text-secondary": "#566B7F",

        // Status colors
        success: "#43A047",
        warning: "#FFA000",
        error: "#E53935",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
      spacing: {
        // Base unit of 4px with increments
        0: "0px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        20: "80px",
      },
    },
  },
  plugins: [],
};
