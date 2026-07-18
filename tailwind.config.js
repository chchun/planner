/** @type {import('tailwindcss').Config} */
// 토큰 출처: docs/TOKENS.md — 수치가 애매하면 docs/prototype.html이 정답
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', "Pretendard", "-apple-system", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
          soft: "#eef2ff",
        },
        subject: {
          math: "#4f46e5",
          english: "#0ea5e9",
          korean: "#f97316",
          science: "#10b981",
          social: "#a855f7",
        },
        dot: {
          sched: "#3b82f6",
          hw: "#f97316",
        },
      },
      borderRadius: {
        card: "18px",
        chip: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.06)",
        modal: "0 30px 70px -20px rgba(15,23,42,0.4)",
        sheet: "0 -8px 30px rgba(15,23,42,0.15)",
      },
      keyframes: {
        sheetUp: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        acc: {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        ringPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(79,70,229,0.35)" },
          "70%": { boxShadow: "0 0 0 14px rgba(79,70,229,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(79,70,229,0)" },
        },
      },
      animation: {
        sheetUp: "sheetUp 0.28s cubic-bezier(0.22,1,0.36,1)",
        fadeIn: "fadeIn 0.2s ease",
        acc: "acc 0.22s ease",
        pop: "pop 0.24s cubic-bezier(0.22,1,0.36,1)",
        ringPulse: "ringPulse 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
