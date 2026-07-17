/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#121212',       // near-black background
        paper: '#F5F5F0',     // off-white text/surface
        alert: '#E63946',     // urgency red accent - the pressure color
        steel: '#4A5859',     // muted supporting tone
        line: '#2A2A2A'       // hairline dividers on dark bg
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      }
    }
  },
  plugins: []
};
