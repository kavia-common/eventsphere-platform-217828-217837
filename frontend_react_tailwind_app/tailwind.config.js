/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Ocean Professional palette
        primary: "#2563EB",   // blue-600
        secondary: "#F59E0B", // amber-500
        success: "#F59E0B",   // using the same as secondary per spec
        error: "#EF4444"      // red-500
      },
      backgroundImage: {
        // gradient as requested: from-blue-500/10 to-gray-50
        "ocean-fade": "linear-gradient(to right, rgba(59,130,246,0.1), #F9FAFB)"
      },
      // Provide a convenience gradient color stop config
      gradientColorStops: {
        // ensures we can use from-blue-500/10 to-gray-50 via tailwind utilities (already exists),
        // bg-ocean-fade is also available via backgroundImage above.
      },
      boxShadow: {
        soft: "0 4px 14px rgba(0,0,0,0.08)"
      },
      borderRadius: {
        xl: "1rem"
      }
    },
  },
  plugins: [],
}
