// The Studio skin (studio.css) is on by default through <html data-skin="studio">.
// ?skin=classic shows the original look for side-by-side comparison; ?skin=studio
// goes back. The choice is remembered on this device only.
const KEY = 'protocol-explorer:skin'
const root = document.documentElement

let skin = new URLSearchParams(location.search).get('skin')
try {
  if (skin === 'classic' || skin === 'studio') localStorage.setItem(KEY, skin)
  else skin = localStorage.getItem(KEY)
} catch {}

if (skin === 'classic') delete root.dataset.skin
else root.dataset.skin = 'studio'
