const express = require('express')
const app = express()
const port = 3000
const config = require('config').util.toObject()
const mysql = require('@drivet/database')

app.get('/', (req, res) => {
  res.redirect('https://drivet.xyz')
})

app.get('*', async (req, res) => {
  const data = await mysql.rowQuery('SELECT * FROM links WHERE shortcode = ?', req.url.replace(/\//g, ''))

  if (data && data.shortcode) {
    res.redirect(data.url)
  } else {
    res.status(400).json({
      error: true,
      code: 404,
      message: 'The link does not exist or has been deleted from the server'
    })
  }
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})