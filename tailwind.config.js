/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary": "#690008",
                "on-surface": "#251817",
                "primary-container": "#8b1a1a",
                "surface": "#FFFFFF",
                "canvas": "#F7F7F7",
                "success": "#059669",
                "danger": "#DC2626",
            },
            fontFamily: {
                "h1": ["Playfair Display"],
                "body-md": ["DM Sans"],
            },
            boxShadow: {
                'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
            }
        },
    },
    plugins: [require('@tailwindcss/forms')],
}