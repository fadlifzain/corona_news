require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

var globalClient = null;

exports.startServer = async (app) => {
    app.listen(process.env.PORT || 3000, () => {
        console.log('listening on 3000')
    })
}

exports.mongoConnect = async () => {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_HOST_URL, {
            useNewUrlParser: true, useUnifiedTopology: true
        }).catch(err => { console.log(err); });

        globalClient = client;

        return client.db(process.env.MONGODB_DATABASE);
    } catch(err) {
        console.log(err);
    }
}

exports.mongoClose = async() => {
    try {
        await globalClient.close();
    } catch(err) {
        console.log(error);
    }
}