/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
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
