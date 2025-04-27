const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        let messages = [];
        if (fs.existsSync('messages.json')) {
            messages = JSON.parse(fs.readFileSync('messages.json'));
        }
        res.json({ success: true, messages: messages });
    } else {
        res.json({ success: false });
    }
});

app.post('/send', async (req, res) => {
    const message = req.body.message;
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    let location = 'Nieznana lokalizacja';
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        location = `${data.city || 'Nieznane miasto'}, ${data.region || 'Nieznany region'}, ${data.country_name || 'Nieznany kraj'}`;
    } catch (err) {
        console.log('Błąd geolokalizacji:', err);
    }

    const newEntry = {
        message: message,
        ip: ip,
        location: location,
        time: new Date().toISOString()
    };

    let messages = [];
    if (fs.existsSync('messages.json')) {
        messages = JSON.parse(fs.readFileSync('messages.json'));
    }
    messages.push(newEntry);
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Nowa wiadomość!',
        text: `Treść: ${message}\nIP: ${ip}\nLokalizacja: ${location}\nCzas: ${new Date().toLocaleString('pl-PL')}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('E-mail wysłany: ' + info.response);
        }
    });

    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`✅ Serwer działa na http://localhost:${port}`);
});