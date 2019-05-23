const tweets = document.getElementById('tweets')
const title = document.getElementById('title')
const ctx = document.getElementById('twitter-chart').getContext('2d')

const chart = new Chart(ctx, {
  type: 'line',
  // The data for our dataset
  data: {
    labels: [],
    datasets: [
      {
        label: 'Trade War tweets count',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        fill: false,
        data: [],
      },
    ],
  },
  // Configuration options go here
  options: {},
})

const toLabel = date =>
  `${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`

firebase
  .database()
  .ref()
  .once('value', snapshot => {
    const histories = Object.values(snapshot.val())
    chart.data.labels = histories.map(history =>
      toLabel(new Date(history.time)),
    )
    chart.data.datasets[0].data = histories.map(history => history.count)
    chart.update()
  })

const socket = io()

socket.on('status', status => {
  console.log(status)
  if (status === 'cooling') {
    title.innerText =
      'Trade War Tweets Trend (Rate Limit Exceeded, cooling down for 1 min.)'
  } else {
    title.innerText = 'Trade War Tweets Trend'
  }
})

socket.on('tweet', tweet => {
  console.log('tweet in', tweet)
  tweets.innerHTML = [
    tweets.innerHTML,
    `
    <p class="tweet">${tweet}</p>
  `,
  ].join('')
})

socket.on('count', ({ count, time }) => {
  console.log(toLabel(new Date(time)))
  chart.data.labels.push(toLabel(new Date(time)))
  chart.data.datasets[0].data.push(count)
  chart.update()
})
