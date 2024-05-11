const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


console.log(process.env.Secret, 'from sectet')
// middlewars
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zwicj3r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const allFoodsCollection = client.db("foodDB").collection("foods");

        // allFoodsCollection api 
        app.post('/allFoods', async (req, res) => {
            const food = req.body;
            const result = await allFoodsCollection.insertOne(food);
            res.send(result)
        })

        app.get('/all-foods', async(req, res)=> {
            const search = req.query.search ; 
            console.log(req.query.sort) ;
            const sort = req.query.sort ;
            const query = { 
                foodName : { $regex : search, $options: 'i'},
             }
             let options = {} ;
             if (sort) options = { sort: { expiredDate: sort === 'asc' ? 1 : -1 } }
             const result = await allFoodsCollection.find(query , options).toArray()
             res.send(result)
        })
        
        app.get('/allFoods', async (req, res) => {
            const result = await allFoodsCollection.find().toArray();
            res.send(result)
        })
        app.get('/allFoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allFoodsCollection.findOne(query);
            res.send(result)
        })

        app.get('/allFood/:email', async (req, res) => {
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
        app.put('/allFoodsupdate/:id', async (req, res)=> {
            const id = req.params.id ;
            const updatedFoods = req.body ;
            const query = { _id : new ObjectId(id)} ;
            const options = { upsert : true} ;

            const updateDoc = {
                $set : {
                    ...updatedFoods
                }
            }
            const result = await allFoodsCollection.updateOne(query, updateDoc,options) ;
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

