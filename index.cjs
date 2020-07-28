module.exports = (robot) => {
  import('./src/index.js')
    .then(module => module.default(robot))
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
}
