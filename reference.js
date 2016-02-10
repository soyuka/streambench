'use strict'
const Stream = require('stream')
const fs = require('fs')

let start = null
let bytes = 0

function reference() {
  let transform = new Stream.Transform({
    transform: function(chunk, enc, next) {
      if(start === null)
        start = process.hrtime()

      bytes += chunk.length

      process.nextTick(() => next())
    },
    flush: function(done) {
      done() 
    }
  })

  transform.on('finish', function() {
    let diff = process.hrtime(start)
    diff = diff[0] * 1e9 + diff[1]

    // console.log('%d bytes processed', bytes)
    // console.log('%d bytes per sec', bytes / diff * 1e9)
    this.emit('bytes', bytes)
    this.emit('speed', bytes / diff * 1e9)
    bytes = 0
    start = null
  })

  return transform
}

module.exports = reference
