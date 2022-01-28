const express = require('express')
const app = express()
const config = require('config').util.toObject()
const mysql = require('./database')
const catloggr = require('cat-loggr')
const console = new catloggr()
const randomstring = require("randomstring")
const rateLimit = require("express-rate-limit")

app.set('trust proxy', true)
app.use(express.json())

const shortenerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: "Too many link shorteners created from this IP, please try again after an hour"
});

app.get('/', (req, res) => {
  res.redirect('https://drivet.xyz')
})

app.post('/', shortenerLimiter, (req, res) => {
  let pattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm;

  if (!req.body.url) return res.status(400).json({ error: true, code: 400, message: 'Missing "url" from the body' })
  if (!pattern.test(req.body.url)) return res.status(400).json({ error: true, code: 400, message: 'Please enter a valid url.' })

  const shortcode = randomstring.generate(6)

  mysql.rowQuery('INSERT INTO links SET ?', { url: req.body.url, shortcode, ip: req.ip })

  return res.status(200).json({ shortcode, url: `https://r.drivet.xyz/${shortcode}`, })
})

app.get('/ping', async (req, res) => {
  return res.status(200).json({ status: 'OK' })
})

app.get('/:shortcode', async (req, res) => {
  const data = await mysql.rowQuery('SELECT url FROM links WHERE shortcode = ?', req.params.shortcode)
  if (req.url.replace(/\//g, '') === 'favicon.ico') return;

  if (!data) {
    console.info(`[${req.ip}] Unsuccessful Hit on "${req.params.shortcode}"`)
    return res.status(404).json({
      error: true,
      code: 404,
      message: 'The link does not exist or has been deleted from the server'
    }) 
  }

  console.info(`[${req.ip}] Successful Hit on "${req.params.shortcode}". Redirecting user`)
  res.redirect(data.url)
})

app.listen(config.web.port, () => {
  console.log(`Listening on port ${config.web.port}`)
})