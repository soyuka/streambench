'use strict'
const Stream = require('stream')
const fs = require('fs')
const Jhaml = require('@soyuka/jhaml')

let start = null
let bytes = 0

let jhaml = new Jhaml.tohtml()

module.exports = function jhamltr() {
  let transform = new Stream.Transform({
    transform: function(chunk, enc, next) {
      if(start === null)
        start = process.hrtime()

      bytes += chunk.length

      jhaml._transform(chunk, enc, next)
    },
    flush: function(done) {
      jhaml._flush(done)
    }
  })

  transform.on('finish', function() {
    let diff = process.hrtime(start)
    diff = diff[0] * 1e9 + diff[1]

    // console.log('%d bytes processed', bytes)
    // console.log('%d bytes per sec', bytes / diff1e9)
    this.emit('bytes', bytes)
    this.emit('speed', bytes / diff * 1e9)
    bytes = 0
    start = null
  })

  return transform
}
