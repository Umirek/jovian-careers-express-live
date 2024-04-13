require('dotenv').config();


const multer = require('multer');

const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const express = require('express');
const path = require('path');
const JOBS = require('./jobs');
const mustacheExpress = require('mustache-express');

const transporter = nodemailer.createTransport({
    host: 'mail.gmx.net', // SMTP host
    port: 587, // SMTP port
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD
    }

});

const app = express();

const storage = multer.memoryStorage()

const upload = multer({storage })


app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'pages'));
app.set('view engine', 'mustache');
app.engine('mustache', mustacheExpress());


app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, 'pages/index.html'));
    res.render('index', {jobs: JOBS});
});

app.get('/jobs/:id', (req, res) => {
    const id = req.params.id;
    const matchedJob = JOBS.find(job => job.id.toString() === id);
    res.render('job', {job: matchedJob});
});

/* app.post('/jobs/:id/apply', (req, res) => {
    res.send("Got the application");
}) */
app.use(bodyParser.urlencoded({extended: false}));

app.post('/jobs/:id/apply', upload.single('file'),(req, res) => {
    const {name, email, phone, birthday, coverletter, terms} = req.body;
    const file = req.file;
    const id = req.params.id;
    const matchedJob = JOBS.find(job => job.id.toString() === id);

    console.log('File:', file);

    const mailOptions = {
        from: process.env.EMAIL_ID,
        to: process.env.EMAIL_ID,
        subject: `New Application for  ${matchedJob.title}`,
        html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date of Birth:</strong> ${birthday}</p>
        <p><strong>Cover Letter:</strong> ${coverletter}</p>
        `,
        attachments: [
            {
                filename: file.originalname, // Use the original filename of the uploaded file
                content: file.buffer // Use the path where the uploaded file is stored
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {

        if (error){
            console.log(error);
            res.status(500).send('Error sending email');

        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).render('applied');
        }
    });
});



const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
});
