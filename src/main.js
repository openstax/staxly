const { Server, Probot } = require('probot')
const app = require('./index.js')

async function startServer () {
  const server = new Server({
    Probot: Probot.defaults({
      appId: 123,
      privateKey: 'content of your *.pem file here',
      secret: 'webhooksecret123'
    })
  })

  await server.load(app)

  server.start()
}
