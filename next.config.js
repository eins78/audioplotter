const nextPwa = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')

const withPWA = nextPwa({
  dest: 'public',
  runtimeCaching,
})

module.exports = withPWA({
  // needed when building a Docker image for the app
  output: 'standalone',
})
