import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#07120c",
        graphite: "#102118",
        metal: "#1d3a28",
        paper: "#08150d",
        panel: "#0d1d13",
        line: "#3d3320",
        signal: "#2f8a55",
        electric: "#3ca86a",
        volt: "#9a7428",
        warning: "#8f5f1e",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(0, 0, 0, 0.38)",
        volt: "0 20px 70px rgba(154, 116, 40, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
