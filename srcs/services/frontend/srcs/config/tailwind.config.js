/** @type {import('tailwindcss').Config} */
module.export = {
  content: [
    "../**/*.ejs",
    "../**/*.js",
    "../**/*.ts",
    "../**/*.html",
    "./srcs/public/**/*.{html,js,ts,ejs}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

