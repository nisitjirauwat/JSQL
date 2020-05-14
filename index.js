const express = require('express')
const app = express()

const PORT = 3000

app.use('/', express.static('public'))

app.get('/random-numbers', (req, res) => {

})

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`))


const randomNumber = () => {
    const number = parseInt(Math.random() * 100)
    return number < 10 ? number + 10 : number;
}