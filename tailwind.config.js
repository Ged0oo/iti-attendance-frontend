/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#690008",
                "primary-deep": "#6B1212",
                "primary-container": "#8b1a1a",
                "primary-ember": "#A82020",
                "primary-mist": "#F9EAEA",

                "surface": "#FFFFFF",
                "surface-variant": "#f5dddb",
                "on-surface": "#251817",
                "canvas": "#F7F7F7",

                "secondary": "#715858",
                "secondary-fixed-dim": "#dfbfbe",
                "outline": "#8c716e",
                "shell-border": "#2D1515",

                "success": "#059669",
                "success-mist": "#ECFDF5",
                "warning": "#D97706",
                "warning-mist": "#FFFBEB",
                "danger": "#DC2626",
                "danger-mist": "#FEF2F2",
                "info": "#2563EB",
                "info-mist": "#EFF6FF",

                // Roles & Engagements                                                                             
                "role-bm": "#7C3AED",
                "role-ta": "#0369A1",
                "role-instructor": "#0D9488",
                "role-student": "#6B7280",
                "engagement-lecture": "#8B1A1A",
                "engagement-lab": "#0D9488",
                "engagement-biz": "#D97706",
            },
            fontFamily: {
                "display": ["Playfair Display", "serif"],
                "h1": ["Playfair Display", "serif"],
                "h1-mobile": ["Playfair Display", "serif"],
                "h2": ["Playfair Display", "serif"],
                "h3": ["DM Sans", "sans-serif"],
                "body-lg": ["DM Sans", "sans-serif"],
                "body-md": ["DM Sans", "sans-serif"],
                "body-sm": ["DM Sans", "sans-serif"],
                "label": ["DM Sans", "sans-serif"],
                "label-caps": ["DM Sans", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
                "kpi": ["Playfair Display", "serif"],
            },
            fontSize: {
                "display": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "400" }],
                "h1": ["36px", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "400" }],
                "h1-mobile": ["28px", { lineHeight: "1.2", fontWeight: "400" }],
                "h2": ["28px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "400" }],
                "h3": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
                "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
                "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
                "body-sm": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
                "label": ["13px", { lineHeight: "1", letterSpacing: "0.01em", fontWeight: "500" }],
                "label-caps": ["11px", { lineHeight: "1", letterSpacing: "0.08em", fontWeight: "600" }],
                "mono": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
                "kpi": ["40px", { lineHeight: "1", fontWeight: "400" }],
            },
            spacing: {
                "1": "4px",
                "2": "8px",
                "3": "12px",
                "4": "16px",
                "5": "20px",
                "6": "24px",
                "8": "32px",
                "10": "40px",
                "12": "48px",
                "base": "4px",
                "gutter": "24px",
                "margin-mobile": "16px",
                "margin-desktop": "32px",
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')
    ],
}