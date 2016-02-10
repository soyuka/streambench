'use strict'
const Benchmark = require('benchmark')
const fs = require('fs')
const suite = new Benchmark.Suite
const reference = require('../reference.js')
const jhaml = require('../jhaml.js')
const jhamltojavascript = require('../jhaml.javascript.js')
const jhamltohtml = require('../jhaml.html.js')

//array that will be used to store speeds and compute an average
var avg = []
var bytes = []
var num = 0

function bench(transform, deferred) {
  transform.on('bytes', function(b) { 
    bytes.push(b) 
    num++
  })
  transform.on('speed', function(speed) {
    avg.push(speed)
    deferred.resolve() 
  })

  fs.createReadStream(`${__dirname}/../page.small.haml`)
  .pipe(transform)
}

suite
.add('reference', function(deferred) {
  bench(reference(), deferred)
}, {defer: true})
.add('jhamltojavascript', function(deferred) {
  bench(jhamltojavascript(), deferred)
}, {defer: true})
.add('jhamltohtml', function(deferred) {
  bench(jhamltohtml(), deferred)
}, {defer: true})
.add('jhaml', function(deferred) {
  bench(jhaml(), deferred)
}, {defer: true})
.on('cycle', function(event) {
  console.log(String(event.target))
  let l = avg.length
  avg = avg.reduce((p, n) => p += n)
  avg /= l
  console.log('Average speed %d Megabytes/s', (avg / 1e6).toFixed(2))
  avg = []
  console.log('Cycle read %d Megabytes in %d runs', (bytes.reduce((p, n) => p += n) / 1e6).toFixed(2), num)
  bytes = []
  num = 0
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
  console.log('Slowest is ' + this.filter('slowest').map('name'));
})
.run({async: true})
