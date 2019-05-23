const express = require('express')
const path = require('path')
const cors = require('cors')
const Twitter = require('twitter')
const socketIO = require('socket.io')
const firebase = require('firebase')
const config = require('./config')

const client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret,
})

firebase.initializeApp({
  apiKey: 'AIzaSyDcf7qU7W7YcytW-wrolNsl447XT1QkFBc',
  authDomain: 'swp-final-exam-241506.firebaseapp.com',
  databaseURL: 'https://swp-final-exam-241506.firebaseio.com',
  projectId: 'swp-final-exam-241506',
  storageBucket: 'swp-final-exam-241506.appspot.com',
  messagingSenderId: '958053292968',
  appId: '1:958053292968:web:b9330321bdf259f6',
})

const app = express()
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/home.html'))
})
const http = app.listen(process.env.PORT || 3000, () => {
  console.log('server started')
})

/* Steaming logic */
let count = 0
let status = 'listening'

setInterval(() => {
  if (status === 'listening') {
    const event = { count, time: Date.now() }
    console.log('counting')
    io.sockets.emit('count', event)
    firebase
      .database()
      .ref()
      .push(event)
    count = 0
  }
}, 60 * 1000)

const io = socketIO.listen(http)

io.on('connection', client => {
  console.log('user connected')
  io.sockets.emit('count', { count, time: Date.now() })
  io.sockets.emit('status', status)
  client.on('disconnect', () => {
    console.log('user disconnected')
  })
})

const listen = () => {
  const stream = client.stream('statuses/filter', { track: 'tradewar' })
  stream.on('data', event => {
    if (event) {
      count++
      status = 'listening'
      io.sockets.emit('status', 'listening')
      io.sockets.emit('tweet', event.text)
    }
  })

  stream.on('error', function(error) {
    console.log(error)
    status = 'cooling'
    console.log('cooling down')
    io.sockets.emit('status', status)
    stream.destroy()
    setTimeout(() => {
      listen()
    }, 60 * 1000)
  })
}

listen()
