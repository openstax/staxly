import fetch from 'node-fetch'
import sax from 'sax'
import { ensureEnv } from './utils/ensureEnv.js'

export default (app) => {
  app.on('create', async (context) => {
    const CORGI_URL = `https://${ensureEnv('CORGI_HOSTNAME')}/api/jobs/`
    const SLACK_URL = `https://hooks.slack.com/services/${ensureEnv('CORGI_SLACK_SECRET')}`
    // NOTE: if we miss webhooks look into persistence
    const logger = app.log.child({ name: 'corgi-tag-watcher' })

    logger.info('received webhook.')

    // Do we need to filter events?
    if (context.payload.ref_type !== 'tag') { return }
    // get books in repo
    const contentRequest = context.repo({ path: 'META-INF/books.xml' })
    const contentMetadata = await context.octokit.repos.getContent(contentRequest)
    const content = Buffer.from(contentMetadata.data.content, contentMetadata.data.encoding)

    const repo = context.payload.repository.name

    const books = []
    const parser = sax.parser()
    parser.onopentag = (node) => {
      if (node.name === 'BOOK') {
        books.push([node.attributes.SLUG, 'STYLE' in node.attributes ? node.attributes.STYLE : 'dummy'])
      }
    }
    parser.write(content).close()

    // send job details to CORGI API
    // make request per book + job type
    let jobStatus = 'failed to queue'

    try {
      for (const [slug, style] of books) {
        for (const jobType of [3, 4]) {
          // 3: git-pdf
          // 4: git-distribution-preview

          logger.info(`collection_id: ${repo}/${slug}`)
          logger.info(`job_type_id: ${jobType}`)

          const payload = {
            collection_id: `${repo}/${slug}`,
            job_type_id: jobType,
            status_id: 1,
            version: `${context.payload.ref}`,
            style: style
          }

          const response = await fetch(CORGI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          logger.info(response.status.toString())
          if (response.status !== 200) { throw new Error('CORGI is not responding!') }
        }
      }

      jobStatus = 'successfully queued'
    } catch { }

    let bookList = ''
    books.forEach((book) => {
      bookList += `\n - ${book}`
    })

    logger.info('Attempting to send slack message to channel')
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
