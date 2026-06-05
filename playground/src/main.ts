const apiUrl = import.meta.env.VITE_API_URL
const apiKey = process.env.VITE_API_KEY

document.querySelector('#app')!.textContent =
  `API URL: ${apiUrl}\nAPI Key: ${apiKey}`
