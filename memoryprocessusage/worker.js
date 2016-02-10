'use strict'
const relieve = require('relieve')
const CallableTask = relieve.tasks.CallableTask
const QueueWorker = relieve.workers.QueueWorker
const worker = new QueueWorker({concurrency: 1})
const pidusage = require('pidusage')
const pace = require('pace')

const RUNS = 400
const MONIT_INTERVAL = 1
const memory = {}
const speed_memory = {}
const bytes_memory = {}

var speed_avg = []
var current = null
var previous = null

let scripts = ['jhaml.html', 'jhaml.javascript', 'jhaml', 'reference']
let paths = scripts.map(e => `${__dirname}/../${e}.js`)

const progress = pace({
  total: RUNS * scripts.length, 
  custom: function(charm) {
    let str = current !== null ? current.name : ''

    let avg = speed_avg
    let l = avg.length
    if(!l)
      return str

    avg = avg.reduce((p, n) => p += n)
    avg /= l
    return str + ' (' + (avg / 1e6).toFixed(2) + ' MB/s' + ')'
  }
})

function Stat() {
  return {
    interval: null,
    start: function(pid, memory) {
      this.interval = setInterval(function() {
        pidusage.stat(pid, function(err, stat) {
          if(stat)
            memory.push(stat)
        }) 
      }, MONIT_INTERVAL) 
    },
    stop: function(pid) {
      clearInterval(this.interval) 
      pidusage.unmonitor(pid)
    }
  }
}

for(let i in paths) {
  if(!memory[scripts[i]])
    memory[scripts[i]] = []
  if(!speed_memory[scripts[i]])
    speed_memory[scripts[i]] = []
  if(!bytes_memory[scripts[i]])
    bytes_memory[scripts[i]] = []

  let x = RUNS

  while(x--) {
    let task = new CallableTask(`${__dirname}/task.js`)
    let stat = new Stat()
    let pid

    task.arguments = [paths[i]]
    task.name = scripts[i] + '-' + (x+1)

    task.once('start', function() {
      current = task

      if(previous !== null && !previous.name.startsWith(scripts[i]))
        speed_avg = []

      pid = task._fork.pid
      stat.start(pid, memory[scripts[i]])
      task.call('run')
      progress.op()
    })

    task.once('exit', function() {
      current = null
      previous = task
      stat.stop(pid) 
    })

    task.once('bytes', function(b) { 
      bytes_memory[scripts[i]].push(b) 
    })

    task.once('speed', function(speed) {
      speed_avg.push(speed)
      speed_memory[scripts[i]].push(speed)
    })

    worker.add(task)
  }
}

worker.run()
.then(function() {
  for(let i in scripts) {
    let mem_avg = 0
    let mem_num = 0
    let cpu_avg = 0
    let cpu_num = 0
    let mem = memory[scripts[i]]
    let speed_avg = speed_memory[scripts[i]]

    let l = speed_avg.length
    speed_avg = speed_avg.reduce((p, n) => p += n)
    speed_avg /= l

    let count = bytes_memory[scripts[i]].length
    let readen = bytes_memory[scripts[i]]
    readen = readen.reduce((p, n) => p += n)

    mem.map(e => {
      mem_avg += e.memory            
      mem_num++
      cpu_avg += e.cpu
      cpu_num++
    })

    mem_avg /= mem_num
    cpu_avg /= cpu_num

    console.log(
`%s (%d runs):
  took an average of %d MB memory usage
  process usage was about %d %
  average speed: %d MB/s
  bytes readen: %d MB`,
      scripts[i], count,
      (mem_avg / 1e6).toFixed(2), 
      (cpu_avg).toFixed(2),
      (speed_avg / 1e6).toFixed(2),
      (readen / 1e6).toFixed(2)
    )

  }
})

worker.on('error', function(err) {
 console.error(err); 
})
