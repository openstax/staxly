export function ensureEnv (key) {
  const v = process.env[key]
  /* istanbul ignore if */
  if (!v) { throw new Error(`ERROR: Missing environment variable '${key}'`) }
  return v
}
