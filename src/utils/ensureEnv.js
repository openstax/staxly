export function ensureEnv(key) {
    const v = process.env[key]
    if (!v) { throw new Error(`ERROR: Missing environment variable '${key}'`) }
    return v
}