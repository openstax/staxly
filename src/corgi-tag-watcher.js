import fetch from 'node-fetch'
import sax from 'sax'

const CORGI_URL = `https://${process.env.CORGI_URL}.openstax.org/api/jobs/`
const SLACK_URL = `https://hooks.slack.com/services/${process.env.CORGI_SLACK_SECRET}`

export default (app) => {
  app.on('create', async (context) => {
    // NOTE: if we miss webhooks look into persistence

    app.log.info('recieved webhook.')

    // Do we need to filter events?
    if (context.payload.ref_type !== 'tag') { return }

    // get books in repo
    const contentRequest = context.repo({ path: 'META-INF/books.xml' })
    const contentMetadata = await context.octokit.repos.getContent(contentRequest)
    const contentData = contentMetadata.data
    const content = await context.octokit.request(contentData.download_url)

    // app.log.info(content.data)

    const repo = context.payload.repository.name

    const books = []
    const parser = sax.parser()
    parser.onopentag = (node) => {
      if (node.name === 'BOOK') {
        books.push(node.attributes.SLUG)
      }
    }
    parser.write(content.data).close()

    // send job details to CORGI API
    // make request per book + job type
    let jobStatus = 'failed to queue'

    try {
      for (const slug of books) {
        for (const jobType of [3, 4]) {
          // 3: git-pdf
          // 4: git-distribution-preview

          app.log.info(`collection_id: ${repo}/${slug}`)
          app.log.info(`job_type_id: ${jobType}`)

          const payload = {
            collection_id: `${repo}/${slug}`,
            job_type_id: jobType,
            status_id: 1,
            version: `${context.payload.ref}`,
            style: 'business-ethics' // TODO: add style to META-INF
          }

          const response = await fetch(CORGI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          app.log.info(response.status.toString())
          if (response.status !== 200) { throw new Error('waaaaah!') }
        }
      }

      jobStatus = 'successfully queued'
    } catch { }

    let bookList = ''
    books.forEach((book) => {
      bookList += `\n - ${book}`
    })

    await fetch(SLACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({
        text:
          `CORGI job(s) ${jobStatus} for ${bookList}`
      })
    })
  })
}
