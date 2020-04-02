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
    try {
        getIdData();
        getGlobalData();
    } catch (err) {
        console.log(err);
    }
}

const getIdData =  (params) => {
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

        if (!article.urlToImage) article.urlToImage = "https://semantic-ui.com/images/wireframe/image.png"
        if (!article.author) article.author = article.source.name;
        return article
    }).sort((x, y) => new Date(x.publishedAt) - new Date(y.publishedAt));
    storeDataId(result);
}

const getGlobalData =  (params) => {
    const toDate = moment.tz(moment(), 'Asia/Jakarta').startOf('hour').format();
    const fromDate = moment(toDate).subtract(6, 'hour').startOf('hour').format();
    const baseUrl = process.env.NEWSAPI_BASE_URL;
    const apiKey = process.env.NEWSAPI_API_KEY;
    
    const params = qs.stringify({
        qInTitle: 'corona OR covid 19 OR covid19',
        from: fromDate,
        to: toDate,
        apiKey: apiKey,
        language: 'en',
        sortBy: 'popularity',
        page: page,
        pageSize: 100
    });

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

        if (!article.urlToImage) article.urlToImage = "https://semantic-ui.com/images/wireframe/image.png"
        if (!article.author) article.author = article.source.name;
        return article
    }).sort((x, y) => new Date(x.publishedAt) - new Date(y.publishedAt));
    storeDataGlobal(result);
}

const storeDataId = async (data) => {
    try {
        console.log(data.length);
        if (data.length < 1) return;

        const db = await config.mongoConnect();
        Promise.all(
            data.forEach((x) => {
                return db.collection('articles-id').updateOne({
                    slug: x.slug,
                    url: x.url
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

const storeDataGlobal = async (data) => {
    try {
        console.log(data.length);
        if (data.length < 1) return;

        const db = await config.mongoConnect();
        Promise.all(
            data.forEach((x) => {
                return db.collection('articles-en').updateOne({
                    slug: x.slug,
                    url: x.url
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