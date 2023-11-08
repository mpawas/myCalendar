const express = require('express')
const app = express()
const port = 3000;
const htmlParser = require('node-html-parser');
const axios = require('axios');
const cheerio = require('cheerio')
const admin = require('firebase-admin');
const serviceAccount = require('./mycalendar-3d739-firebase-adminsdk-cisxc-bee0902b0a.json');
const cron = require('node-cron');
const fs = require('fs');
const bodyParser = require('body-parser');

const filePath = 'newToken.txt';
const password = 'Exper!ence4@ll';
const url = 'https://www.drikpanchang.com/?geoname-id=1282988&&date=2023/11/08';
const timeSchedule = '0 8-20/3 * * *';
const testschedule = '* * * * *'

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
    if (password !== req.body.password) return res.status(404).json({ message: "Password Not Matched." })
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

            console.log(info.lunarMonth);
            console.log(info.tithi2);
        }
    })
}

const task = cron.schedule(testschedule, () => {
    apiCall();
}, {
    scheduled: false
});

task.start();

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})