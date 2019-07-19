const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Route for signup
router.post('/signup', (req, res) => {
    // see if the email is already in the db.
    User.findOne({email: req.body.email}, (err, user) => {
        // if yes, then return an error.
        if (user) {
            // if no, create the user in the db.
            res.json({type: 'error',message: 'email already exists'})
        } else {
            let user = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });
            user.save( (err, user) => {
                if (err) {
                    res.json({type: 'error', message: 'Database error creating user', err})
                } else {
                    // sign a token (this is the login step).
                    var token = jwt.sign(user.toObject(), process.env.JWT_SECRET,{
                        expiresIn: "1d"
                    });
                    // res.json the token (the browser needs to store this token).
                    res.status(200).json({type: 'success', user: user.toObject(), token})
                }
            })
        }
    })
})

// Route for login
router.post('/login', (req, res) => {
    // Find user in db by email
    User.findOne({email: req.body.email}, (err, user) => {
        // If there is no user, return error
        if (!user) {
            res.json({type: 'error', message: 'account not found'})
        } else {
            // If user, check authentication
            if(user.authenticated(req.body.password)) {
                // If authenticated, sign a token (login)
                var token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
                    expiresIn: "1d"
                });
                // return the token to be saved by the browser
                res.status(200).json({type: 'success', user: user.toObject(), token})
            } else {
                res.json({type: 'error', message: 'Authentication Failure'})
            }
        }
    })
})

// Route for validating tokens
router.post('/me/from/token', (req, res) => {
    // make sure they sent us a token to check
    var token = req.body.token;
    if (!token) {
        // if no token, return an error
        res.json({type: 'error', message: 'You must submit a valid token'});
    } else {
        // if a token is there, verify it
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                // if token invalid, return an error
                res.json({type: 'error', message: 'Invalid token. Please login again'});
            } else {
                // if token valid, look up the user in the db
                User.findById(user._id, (err, user) => {
                    // if user doesn't exist, return an error
                    if (err) {
                        res.json({type: 'error', message: 'Database error during validation'})
                    } else {
                        // if user does exist, send back user and token
                        // we could sign a new token or just return existing token. 
                        // signing again will update the 'issued at' time for the token
                        // var token = jwt.sign(user.toObject(), process.env.JWT_SECRET,{
                        //     expiresIn: "1d"
                        // });
                        res.json({type: 'success', user: user.toObject(), token})

                    }
                })
            }
        })
    }
})

module.exports = router;