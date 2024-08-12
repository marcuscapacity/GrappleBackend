import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import passport from 'passport';
import config from './config/database.js'; // Adjust path if needed
import User from './app/models/user.js'; // Adjust path if needed
import passportFunction from './config/passport.js'; // Adjust path if needed
import jwt from 'jwt-simple';
import path from 'path';
import cors from 'cors';
import { generate } from 'random-words';

const app = express();
const port = process.env.PORT || 8080;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

// Initialize passport
app.use(passport.initialize());
passportFunction(passport);

// connect to database
mongoose.connect(config.database);
// Routes
const apiRoutes = express.Router();
/*  NOTES: get users is not working. Workout what is going on with why empty user is being sent to Home screen. Find out how app ensures user is supposed
* to get a token.*/
app.get('/', (req, res) => {
    res.sendFile(path.join('/Users/marcwatts/PycharmProjects/BackendServer/home.html'));
});

apiRoutes.get('/puzzle', (req, res) => {
    res.sendFile(path.join('/Users/marcwatts/PycharmProjects/BackendServer/puzzle.html'));
});

apiRoutes.post('/register', (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.json({ success: false, msg: 'Please pass email and password.' });
    }
    console.log('req.body.email: ', req.body.email)

    const newUser = new User({
        email: req.body.email,
        password: req.body.password
    });
    console.log('newUser: ', newUser);

    newUser.save()
        .then(() => res.json({ success: true, msg: 'Successful created new user.' }))
        .catch(err => res.json({ success: false, msg: 'Username already exists.', error: 'Username already exists. Error: ' + err }));
});

apiRoutes.post('/auth', (req, res) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.send({ success: false, msg: 'Authentication failed. User not found.' });
            }

            user.comparePassword(req.body.password, (err, isMatch) => {
                if (isMatch && !err) {
                    const token = jwt.encode(user, config.secret);
                    res.json({ success: true, token: 'JWT ' + token });
                } else {
                    res.send({ success: false, msg: 'Authentication failed. Wrong password.' });
                }
            });
        })
        .catch(err => res.status(500).send({ success: false, msg: 'Server error', error: err }));
});

apiRoutes.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    const token = getToken(req.headers);
    if (token) {
        const decoded = jwt.decode(token, config.secret);
        User.findOne({ email: decoded.email })
            .then(user => {
                if (!user) {
                    res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                } else {
                    res.json({ success: true, msg: 'Welcome in the member area ' + user.email + '!' });
                }
            })
            .catch(err => res.status(500).send({ success: false, msg: 'Server error', error: err }));
    } else {
        res.status(403).send({ success: false, msg: 'No token provided.' });
    }
});

function getToken(headers) {
    if (headers && headers.authorization) {
        const parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        }
    }
    return null;
}

apiRoutes.get('/test', (req, res) => {
    const word = generate();
    res.send(word);
});

app.use('/api', apiRoutes);

// Start the server
app.listen(port, () => {
    console.log('There will be dragons: http://localhost:' + port);
});