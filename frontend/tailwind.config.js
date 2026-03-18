/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            },
            colors: {
                wine: {
                    50: '#fcf3f6',
                    100: '#f8e4eb',
                    200: '#f2ccda',
                    300: '#e5a3bf',
                    400: '#d36e9d',
                    500: '#c1467e',
                    600: '#aa2d61',
                    700: '#8f204d',
                    800: '#771d43',
                    900: '#641b3a',
                    950: '#3d0c20',
                }
            }
        },
    },
    plugins: [],
}
