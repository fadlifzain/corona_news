const config = require('./config');
const qs = require('querystring');
const moment = require('moment-timezone');
const axios = require('axios');
const fs = require('fs').promises;

const main = async () => {
    const files = './.counter.dat';
    let counter = 0;

    try {
        await fs.access(files, fs.F_OK)
    } catch (error) {
        fs.appendFile(files, counter.toString());
    }

    try {
        const fileData = await fs.readFile (files);
        counter = counter || parseInt(fileData);

        console.log(counter);

        if (counter === 11) {
            counter = 0;
            fs.writeFile(files, counter.toString());
            return;
        }

        if (counter === 0 || counter === 6) {
            getData();
        }

        counter = counter + 1;
        fs.writeFile(files, counter.toString());
    } catch (e) {
        console.error(e);
    }
}

const getData = async (page = 1) => {
    const toDate = moment.tz(moment(), 'Asia/Jakarta').startOf('hour').format();
    const fromDate = moment(toDate).subtract(6, 'hour').startOf('hour').format();
    const baseUrl = process.env.NEWSAPI_BASE_URL;
    const apiKey = process.env.NEWSAPI_API_KEY;

    const params = qs.stringify({
        qInTitle: 'corona OR covid 19 OR covid19',
        from: fromDate,
        to: toDate,
        apiKey: apiKey,
        language: 'id',
        page: page,
        pageSize: 100
    });

    try {
        const url = `${baseUrl}/everything?${params}`;
        console.log(url);
        const response = await axios.get(url);
        if (response.data.status != "ok") {
            throw("Fetch failed at url");
        }
        const articles = response.data.articles;
        const result = articles.map(article => {
            let slug = article.title;
            slug = slug.replace(/[^a-zA-Z0-9 ]/g, "");
            slug = slug.replace(/\s+/g, '-').toLowerCase();
            article.slug = slug

            return article
        });
        storeData(result);
    } catch (err) {
        console.log(err);
    }
}

const storeData = async (data) => {
    try {
        console.log(data.length);
        if (data.length < 1) return;

        const db = await config.mongoConnect();
        Promise.all(
            data.map((x) => {
                return db.collection('articles-id').updateOne({
                    slug: x.slug
                }, {
                    $set: x
                }, {
                    upsert: true
                })
            })
        ).then(() => {
            Promise.resolve(config.mongoClose());
        });
        // db.collection('articles-id').insertMany(data).then(async () => {
        //     await config.mongoClose();
        // });
    } catch (err) {
        throw err;
    }
}

main();