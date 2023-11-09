const express = require('express')
const app = express()
const port = 3000;
const axios = require('axios');
const cheerio = require('cheerio')
const admin = require('firebase-admin');
const serviceAccount = require('./passkey.json');
const cron = require('node-cron');
const fs = require('fs');
const bodyParser = require('body-parser');

const filePath = 'newToken.txt';
const password = 'Exper!ence4@ll';
const url = 'https://www.drikpanchang.com/?geoname-id=1282988&&date=2023/11/08';
const timeSchedule = '0 8-20/3 * * *';

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const sendPushNotification = async (deviceToken, title, body) => {
    await firebaseAdmin.messaging().send({
        token: deviceToken,
        notification: { title, body }
    })
}

app.post('/', (req, res) => {
    console.log('api called for the post request', req.body.newToken);
    fs.writeFile(filePath, req.body.newToken, (err) => {
        if (err) {
            res.status(400).json({ message: "error" })
        }
    });
    res.status(200).json({ message: "Updated." })
})


const apiCall = () => {
    axios.get(url).then((response) => {
        if (response.status === 200) {
            const $ = cheerio.load(response.data);

            // Use Cheerio selectors to extract specific information
            const info = {
                lunarMonth: $('.dpPHeaderLeftContent div:nth-child(2) div:nth-child(2)').text().trim(),
                tithi2: $('.dpSectionBlockLinks span:nth-child(12)').text().trim(),
            };
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.log(err)
                } else {
                    try {
                        sendPushNotification(data, "Pawas Calendar Update", ` Today's ${info.lunarMonth} \n ${info.tithi2}`);
                    } catch (err) {

                    }
                }
            });
        }
    })
}

const task = cron.schedule(timeSchedule, () => {
    apiCall();
}, {
    scheduled: true,
    timezone: "Asia/Kathmandu"
});

task.start();

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})