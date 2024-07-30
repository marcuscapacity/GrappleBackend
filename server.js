import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import passport from 'passport';
import config from './config/database.js'; // get db config file
import User from './app/models/user.js'; // get the mongoose model
import passportFunction from './config/passport.js';
import jwt from 'jwt-simple';
import path from 'path';
import cors from 'cors';
import {generate} from 'random-words';

const app = express();
const port = process.env.PORT || 8080;


// get our request parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());
// connect to database
// mongoose.connect(config.database);

// pass passport for configuration
passportFunction(passport);
// bundle our routes
const apiRoutes = express.Router();

// demo Route (GET http://localhost:8080)
app.get('/', function (req, res) {
    res.sendFile(path.join('/Users/marcwatts/PycharmProjects/BackendServer/home.html'));
});

apiRoutes.get('/puzzle', function (req, res) {
    res.sendFile(path.join('/Users/marcwatts/PycharmProjects/BackendServer/puzzle.html'));
});



// create a new user account (POST http://localhost:8080/api/register)
apiRoutes.post('/register', function (req, res) {
    console.log('register req: ', req.body)
    if (!req.body.email || !req.body.password) {
        res.json({success: false, msg: 'Please pass email and password.'});
    } else {
        var newUser = new User({
            email: req.body.email,
            password: req.body.password
        });
        // save the user
        newUser.save()
            .then(() => {
                res.json({success: true, msg: 'Successful created new user.'});
            })
            .catch(err => {
                return res.json({
                    success: false,
                    msg: 'Username already exists.',
                    error: 'Username already exists. Error: ' + err
                });
            })
    }
});

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/auth', function (req, res) {
    User.findOne({
        email: req.body.email
    })
        .then(user => {
            if (!user) {
                res.send({success: false, msg: 'Authentication failed. User not found.'});
            } else {
                // check if password matches
                user.comparePassword(req.body.password, function (err, isMatch) {
                    if (isMatch && !err) {
                        // if user is found and password is right create a token
                        const token = jwt.encode(user, config.secret);
                        // return the information including token as JSON
                        res.json({success: true, token: 'JWT ' + token});
                    } else {
                        res.send({success: false, msg: 'Authentication failed. Wrong password.'});
                    }
                });
            }
        })
        .catch(err => {
            throw err;
        })
});

// route to a restricted info (GET http://localhost:8080/api/memberinfo)
apiRoutes.get('/users', passport.authenticate('jwt', {session: false}), function (req, res) {
    console.log('GET /users called')
    const token = getToken(req.headers);
    if (token) {
        const decoded = jwt.decode(token, config.secret);
        User.findOne({
            email: decoded.email
        })
            .then(user => {
                if (!user) {
                    res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
                } else {
                    res.json({success: true, msg: 'Welcome in the member area ' + user.email + '!'});
                }
            })
            .catch(err => {
                throw err;
            })
    } else {
        return res.status(403).send({success: false, msg: 'No token provided.'});
    }
});

function getToken(headers) {
    if (headers && headers.authorization) {
        const parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }

}

apiRoutes.get('/test', function (req, res) {
    console.log('test called')
    const word = generate();
    console.log(word)
    res.send(word)
});

// connect the api routes under /api/*
app.use('/api', apiRoutes);

// Start the server
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);
