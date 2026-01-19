/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: '#F7F7F5', // Cream
                    secondary: '#F0F0EE', // Sidebar
                    card: '#FFFFFF',
                    modal: 'rgba(255, 255, 255, 0.9)',
                },
                text: {
                    primary: '#37352F',
                    secondary: '#787774',
                    tertiary: '#9B9A97'
                },
                accent: {
                    note: '#E6E6FA', // Lavender
                    url: '#FEF3C7',  // Muted Yellow
                    coral: '#FFE4E1',
                    blue: '#2EAADC', // Notion Blue
                    success: '#E3F2E7', // Soft Green
                    danger: '#FDECEC'   // Soft Red
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                serif: ['Merriweather', 'serif']
            },
            boxShadow: {
                'notion': 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
                'subtle': 'rgba(15, 15, 15, 0.1) 0px 1px 2px 0px',
                'card': 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px'
            }
        },
    },
    plugins: [],
}
