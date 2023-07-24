const express = require('express')
const app = express()
const port = 3000

let wallets
try {
    wallets = require('../wallets.json')
} catch {}

app.get('/', (req, res) => {
    res.send({ status: 'up' })
})

const send404 = (res) => {
    res.status(404)
    res.send('No wallet found')
}
app.get('/wallets/:code', (req, res) => {
    if (!wallets) {
        send404(res)
    } else {
        const wallet = wallets[req.params['code']]
        if (!wallet) {
            send404(res)
        } else {
            res.send({ wallet })
        }
    }
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Application started`)
    console.log(`Listening on http://0.0.0.0:${port}`)
})
