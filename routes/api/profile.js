const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// Bring in Profile model
const Profile = require('../../models/Profile');
// Bring in User model
const User = require('../../models/User');
//Bring in Post model
const Post = require('../../models/Post');

// @route  GET api/profile/me
// @desc   Get current users profile
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    // Check if there is no profile
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    // If there is a profile, send profile
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  POST api/profile/me
// @desc   Create or update user profile
// @access Private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  // Check for errors
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull everything out from the body
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object to insert to the database (Check to see if its actually coming in before setting it)
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social object (Same as above)
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      // Look for a profile by the user
      let profile = await Profile.findOne({ user: req.user.id });

      // If the profile is found, update it and send back the profile
      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create new profile, if its not found above
      profile = new Profile(profileFields);

      // Save the profile
      await profile.save();

      // Return the profile
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route  GET api/profile
// @desc   Get all profiles
// @access Public

router.get('/', async (req, res) => {
  try {
    // Get profiles by using Profile model, add the name and the avatar from User model
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);

    // Send along profiles
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/user/:user_id
// @desc   Get profile by user id
// @access Public

router.get('/user/:user_id', async (req, res) => {
  try {
    // Get profiles by using Profile model, add the name and the avatar from User model
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    // Check if there is a profile for the user

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    // Send along the profile
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/profile
// @desc   Delete profile, user & posts
// @access Private

router.delete('/', auth, async (req, res) => {
  try {
    // Remove users posts
    await Post.deleteMany({ user: req.user.id });
    // Find a Profile by user ID, and remove it
    await Profile.findOneAndRemove({ user: req.user.id });

    // Remove User
    await User.findOneAndRemove({ _id: req.user.id });

    // Return a message
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/experience
// @desc   Add profile experience
// @access Private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      // Find the profile to add experience on
      const profile = await Profile.findOne({ user: req.user.id });

      // Push the most recent experience first of the array
      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route  DELETE api/profile/experience/:exp_id
// @desc   Delete experience from profile
// @access Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    // Find the profile of the user to delete
    const profile = await Profile.findOne({ user: req.user.id });

    // Get the remove index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    // Take the profile and remove one experience from it
    profile.experience.splice(removeIndex, 1);

    // Resave the profile
    await profile.save();

    // Send back the response
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/education
// @desc   Add profile education
// @access Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      // Find the profile to add experience on
      const profile = await Profile.findOne({ user: req.user.id });

      // Push the most recent education first of the array
      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route  DELETE api/profile/experience/:edu_id
// @desc   Delete experience from profile
// @access Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    // Find the profile of the user to delete
    const profile = await Profile.findOne({ user: req.user.id });

    // Get the remove index
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    // Take the profile and remove one education from it
    profile.education.splice(removeIndex, 1);

    // Resave the profile
    await profile.save();

    // Send back the response
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/github/:username
// @desc   Get user repos from github
// @access Public

router.get('/github/:username', (req, res) => {
  try {
    // Construct an options object with an URI
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      'user-agent': 'node.js',
      Authorization: `token ${config.get('githubToken')}`,
    };
    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
