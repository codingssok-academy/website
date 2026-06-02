
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./book-cover-3d.cjs.production.min.js')
} else {
  module.exports = require('./book-cover-3d.cjs.development.js')
}
