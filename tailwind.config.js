/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary": "#690008",
                "primary-deep": "#6B1212",
                "primary-ember": "#A82020",
                "primary-mist": "#F9EAEA",
                "on-surface": "#251817",
                "primary-container": "#8b1a1a",
                "surface": "#FFFFFF",
                "surface-sunken": "#F0F0F0",
                "canvas": "#F7F7F7",
                "success": "#059669",
                "success-mist": "#ECFDF5",
                "warning": "#D97706",
                "warning-mist": "#FFFBEB",
                "danger": "#DC2626",
                "danger-mist": "#FEF2F2",
                "info": "#2563EB",
                "info-mist": "#EFF6FF",
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
