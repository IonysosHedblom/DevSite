const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

// User model
const User = require('../../models/User');


// @route  GET api/auth
// @desc   Test route
// @access Public
router.get('/', auth, async (req, res) => {
  try {
    // Check for a user with the request user id which is included in the token
    const user = await User.findById(req.user.id).select('-password');
    // Send back the user
    res.json(user);
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  POST api/auth
// @desc   Authenticate user & get token
// @access Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email')
      .isEmail(),
    check('password', 'Password is required')
      .exists()
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }


      // User located, set an id to user
      const payload = {
        user: {
          id: user.id
        }
      };

      // Signing the token, putting the payload, and the secret in, bring config, set expiration
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        // Change to 3600 before deployment
        { expiresIn: 360000 }, 
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }

  }
);

module.exports = router;