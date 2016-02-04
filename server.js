import request from 'superagent'
import express from 'express'
import socketio from 'socket.io'

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load()
}

let app = express()

let nCustomers = 0
let ltv = 0
let mrr = 0
let mrrChurnRate = 0

app.set('view engine', 'jade')
app.set('views', './views')
app.use('/static', express.static('static'))
app.get('/', (req, res) => {
  res.render('index', {
    nCustomers,
    ltv,
    mrr,
    mrrChurnRate
  })
})

let server = app.listen(process.env.port, () => {
  console.log('Listening on port', process.env.port)
  console.log('Starting chartmogul fetcher')
  getChartMogulInfo()
})

let io = socketio(server)

function getChartMogulInfo() {
  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth()
  let day = date.getDate()
  request
    .get(`https://api.chartmogul.com/v1/metrics/all?start-date=${year}-${month + 1}-${day - 1}&end-date=${year}-${month + 1}-${day}`)
    .auth('b986d9c78080f31bda6608e09e79f277', '2035df7626b912d8a3f146473eb153b4')
    .end((err, response) => {
      if (!!err) {
        throw new Error(err)
      } else {
        let entry = response.body.entries[response.body.entries.length - 1]
        nCustomers = entry.customers
        ltv = parseInt(entry.ltv / 100)
        mrr = parseInt(entry.mrr / 100)
        mrrChurnRate = entry['mrr-churn-rate']
        io.emit('newData', {
          nCustomers,
          ltv,
          mrr,
          mrrChurnRate
        })
        setTimeout(getChartMogulInfo, 10000)
      }
    })
}
