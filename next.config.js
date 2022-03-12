const withPWA = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')

module.exports = withPWA({
  pwa: {
    dest: 'public',
    runtimeCaching,
  },
  experimental: {
    // needed when building a Docker image for the app
    outputStandalone: true,
  }
})
