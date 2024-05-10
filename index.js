const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


console.log(process.env.Secret, 'from sectet')
// middlewars
app.use(cors());
app.use(express())


app.get('/', (req, res) => {
    res.send('This Server Side is Comming')
})
app.listen(port, () => {
    console.log(`The server is running port ${port}`)
})

