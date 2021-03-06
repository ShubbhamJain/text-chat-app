const express = require('express');
const { validate, ValidationError } = require('express-validation');
const jwt = require('jsonwebtoken');

const User = require('../models/users');
const { registerValidation } = require('../middleware/validation');
const { LANG } = require('../config');
const { upload } = require('../utils');

const router = express.Router();

router.post('/', upload.single('profilePic'), validate(registerValidation), async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const { filename } = req.file;

        let checkUser = await User.findOne({ email });

        if (checkUser) {
            return res.json({ error: true, message: LANG.register.userCheck }).status(400);
        }

        let newUser = new User({ profilePic: filename, firstName, lastName, email, password, loggedIn: true });

        newUser.save();

        jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;

                res.json({
                    token,
                    user: {
                        id: newUser.id,
                        profilePic: newUser.profilePic,
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        email: newUser.email,
                        loggedIn: newUser.loggedIn
                    },
                });
            }
        )
    } catch (error) {
        console.error(error);
        res.send(error).status(500);
    }
});

router.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        switch (err.details.body[0]['path'][0]) {
            case 'firstName':
                return res.json({ error: true, message: LANG.register.firstNameErrorMessage }).status(err.statusCode);
            case 'lastName':
                return res.json({ error: true, message: LANG.register.lastNameErrorMessage }).status(err.statusCode);
            case 'email':
                return res.json({ error: true, message: LANG.register.emailErrorMessage }).status(err.statusCode);
            case 'password':
                return res.json({ error: true, message: LANG.register.passwordErrorMessage }).status(err.statusCode);
            default:
                break;
        }
    }
    return res.status(500).json(err);
});

module.exports = router;