const express = require('express')
const app = express()
const config = require('config').util.toObject()
const mysql = require('@drivet/database')
const catloggr = require('cat-loggr')
const console = new catloggr()
const randomstring = require("randomstring")
const rateLimit = require("express-rate-limit")

app.use(express.json())
app.set('trust proxy', true)

const shortenerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: "Too many link shorteners created from this IP, please try again after an hour"
});

app.get('/', (req, res) => {
  res.redirect('https://drivet.xyz')
})

app.post('/', shortenerLimiter, (req, res) => {
  //const pattern = /^((http|https|ftp):\/\/)/;
  let pattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm;

  if (!req.body.url) return res.status(400).json({ error: true, code: 400, message: 'Missing "url" from the body' })
  if (!pattern.test(req.body.url)) return res.status(400).json({ error: true, code: 400, message: 'Please enter a valid url.' })

  const shortcode = randomstring.generate(6)
  const ip = req.headers['x-forwarded-for'] 

  mysql.rowQuery('INSERT INTO links SET ?', { url: req.body.url, shortcode, ip: req.ip })

  return res.status(200).json({ shortcode, url: `https://r.drivet.xyz/${shortcode}`, })
})

app.get('*', async (req, res) => {
  const data = await mysql.rowQuery('SELECT * FROM links WHERE shortcode = ?', req.url.replace(/\//g, ''))

  if (req.url.replace(/\//g, '') === 'favicon.ico') return;

  if (data && data.shortcode) {
    console.info(`Successful Hit on "${data.shortcode}". Redirecting user`)

    res.redirect(data.url)
  } else {
    console.info(`Unsuccessful hit on: "${req.url.replace(/\//g, '')}"`)

    res.status(404).json({
      error: true,
      code: 404,
      message: 'The link does not exist or has been deleted from the server'
    })
  }
})

app.listen(config.web.port, () => {
  console.log(`Listening on port ${config.web.port}`)
})