const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const config = require('./config');
const ObjectId = require('mongodb').ObjectID;

let db = {};
config.startServer(app).then(async () => {
    db = await config.mongoConnect();
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.get('/:locale/get', async (req, res) => {
    try {
        const result = await db.collection(`articles-${req.params.locale}`).find().limit(10).toArray();
        res.send({
            status: "ok",
            content: result
        });
    } catch (err) {
        console.log(err);
        res.status(400).send({
            status: "fail",
            message: err
        });
    }
});

app.get('/:locale/:id/next', async (req, res) => {
    const oid = new ObjectId(req.params.id);
    try {
        const result = await db.collection(`articles-${req.params.locale}`)
            .find({'_id': {
                $gt: oid
            }})
            .limit(10)
            .toArray();
        res.send({
            status: "ok",
            content: result
        });
    } catch (err) {
        res.status(400).send({
            status: "fail",
            message: err
        });
    }
});

app.get('/:locale/:id/prev', async (req, res) => {
    const oid = new ObjectId(req.params.id);
    try {
        const result = await db.collection(`articles-${req.params.locale}`)
            .find({'_id': {
                $lt: oid
            }})
            .limit(10)
            .toArray();
        res.send({
            status: "ok",
            content: result
        });
    } catch (err) {
        res.status(400).send({
            status: "fail",
            message: err
        });
    }
});
