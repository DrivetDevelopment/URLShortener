module.exports = {
  apps: [
    {
      name: 'LinkShortener',
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: "production"
      }
    },
  ]
}