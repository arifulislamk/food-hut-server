const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


console.log(process.env.Sec, 'from sectet')
// middlewars
app.use(cors({
    origin: ['http://localhost:5173',
     'https://food-hut-28b3b.web.app',
    'https://food-hut-28b3b.firebaseapp.com'],
    credentials: true
}));
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zwicj3r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middele ware', token)
    if (!token) {
        return res.status(401).send({ messeage: 'unauthorized access' })
    }
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        //errror
        if (err) {
            console.log(err)
            return res.status(401).send({ messeage: 'unauthorized' })
        }
        //if token is vaild then it will be decoded
        console.log('value in the decoded', decoded)
        req.user = decoded;
        next()
    })
}
const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    secure: process.env.NODE_ENV === "production" ? true : false,
};

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const allFoodsCollection = client.db("foodDB").collection("foods");
        const myRequestedFoodsCollection = client.db("requestDB").collection("request");

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, cookieOptions)
                .send({ success: true })
        })
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log(user)
            res
                .clearCookie('token', { ...cookieOptions, maxAge: 0 })
                .send({ success: true })
        })
        // allFoodsCollection api 
        app.post('/allFoods', async (req, res) => {
            const food = req.body;
            console.log(food)
            const result = await allFoodsCollection.insertOne(food);
            res.send(result)
        })

        app.get('/all-foods', async (req, res) => {
            const search = req.query.search;
            console.log(req.query.sort);
            const sort = req.query.sort;
            const query = {
                foodStatus: 'available',
                foodName: { $regex: search, $options: 'i' },
            }
            let options = {};
            if (sort) options = { sort: { expiredDate: sort === 'asc' ? 1 : -1 } }
            const result = await allFoodsCollection.find(query, options).toArray()
            res.send(result)
        })

        app.get('/allFoods', async (req, res) => {
            const result = await allFoodsCollection.find().sort({ foodQuantity: -1 }).limit(6).toArray();
            res.send(result)
        })
        app.get('/allFoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allFoodsCollection.findOne(query);
            res.send(result)
        })

        app.get('/allFood/:email', verifyToken, async (req, res) => {
            console.log(req.user, 'value from varify token');
            if (req.user.email !== req.params.email) {
                return res.status(403).send({ messeage: 'forbidden access' })
            }
            const email = req.params.email;
            const query = { donatorEmail: email };
            const result = await allFoodsCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/allFoodsdelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allFoodsCollection.deleteOne(query);
            res.send(result)
        })
        app.put('/allFoodsupdate/:id', async (req, res) => {
            const id = req.params.id;
            const updatedFoods = req.body;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    ...updatedFoods
                }
            }
            const result = await allFoodsCollection.updateOne(query, updateDoc, options);
            res.send(result)
        })

        // myRequestedFoodsCollection api 
        app.post('/requestFoods', async (req, res) => {
            const food = req.body;
            const result = await myRequestedFoodsCollection.insertOne(food);
            res.send(result)
        })

        app.get('/requestFoods/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (req.user.email !== req.params.email) {
                return res.status(403).send({ messeage: 'forbidden access' })
            }
            const query = { requestEmail: email }
            const result = await myRequestedFoodsCollection.find(query).toArray();
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('This Server Side is Comming')
})
app.listen(port, () => {
    console.log(`The server is running port ${port}`)
})

