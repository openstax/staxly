module.exports = (...args) => import('./src/index.js')
  .then(module => module.default(...args))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
