const withPWA = require('next-pwa')({
  dest: 'public',
  cacheOnFrontEndNav: true,
  reloadOnOnline: false
})

module.exports = withPWA({
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  reactStrictMode: true
})
