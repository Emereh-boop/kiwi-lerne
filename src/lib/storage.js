// IndexedDB-backed storage using localforage-style API with graceful fallbacks
// We avoid a hard dependency at runtime by importing dynamically if present.

let lf = null

async function getLocalForage() {
  if (lf) return lf
  try {
    const mod = await import('localforage')
    lf = mod.default || mod
    return lf
  } catch (e) {
    return null
  }
}

export async function saveJSON(key, value) {
  const store = await getLocalForage()
  if (store) {
    try {
      await store.setItem(key, value)
      // Mirror to localStorage for quick reads
      localStorage.setItem(key, JSON.stringify(value))
      return
    } catch (e) {}
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {}
}

export async function loadJSON(key, defaultValue = null) {
  const store = await getLocalForage()
  if (store) {
    try {
      const v = await store.getItem(key)
      if (v !== null && v !== undefined) return v
    } catch (e) {}
  }
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return defaultValue
}
