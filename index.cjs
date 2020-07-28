module.exports = (robot) => {
  console.log('here1');

  import('./src/index.js')
    .then(robot)
    .catch(e => console.log(e))
}
