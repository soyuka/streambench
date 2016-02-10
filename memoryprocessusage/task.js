'use strict'
const p = require('path')
const fs = require('fs')
var channel

let path = process.argv[3]
let name = p.basename(path)

let transform = require(path)()

module.exports = {
  setChannel: c => channel = c,
  run: () => {
    fs.createReadStream(`${__dirname}/../page.haml`)
    .pipe(transform)

    transform.on('bytes', (b) => {
      channel.send('bytes', b)
    })

    transform.on('speed', (speed) => {
      channel.send('speed', speed)
      process.exit(0) 
    })
  }
}
