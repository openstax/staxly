module.exports = (robot) => {
  console.log('here1');

  import('./src/index.js')
    .then(mod => {
      console.log('module', mod);
      mod(robot)
    })
    .catch(e => console.log(e))
}
