const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// Bring in Profile model
const Profile = require('../../models/Profile');
// Bring in User model
const User = require('../../models/User');

// @route  GET api/profile/me
// @desc   Get current users profile
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

    // Check if there is no profile
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    // If there is a profile, send profile
    res.json(profile);
  } catch(err) {
    console.error(err.message)
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
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills is required')
        .not()
        .isEmpty()
    ] 
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
      linkedin
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
    profileFields.social = {}
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

    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


module.exports = router;