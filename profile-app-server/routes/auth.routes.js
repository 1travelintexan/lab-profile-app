const router = require('express').Router();
const uploader = require('../middleware/cloudinary.config.js');

// ℹ️ Handles password encryption
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

// Require the models in order to interact with the database
const User = require('../models/User.model');
const PetModel = require('../models/Pet.model');

//protected routes using the jwt token
const { isAuthenticated } = require('../middleware/jwt.middleware');

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require('../middleware/isLoggedOut');
const isLoggedIn = require('../middleware/isLoggedIn');

router.post('/signup', (req, res) => {
  const { username, password, campus, course } = req.body;
  console.log('here is the body for signup', req.body);
  if (!username) {
    return res
      .status(400)
      .json({ errorMessage: 'Please provide your username.' });
  }

  // if (password.length < 8) {
  //   return res.status(400).json({
  //     errorMessage: 'Your password needs to be at least 8 characters long.',
  //   });
  // }

  //   ! This use case is using a regular expression to control for special characters and min length
  /*
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

  if (!regex.test(password)) {
    return res.status(400).json( {
      errorMessage:
        "Password needs to have at least 8 chars and must contain at least one number, one lowercase and one uppercase letter.",
    });
  }
  */

  // Search the database for a user with the username submitted in the form
  User.findOne({ username }).then((found) => {
    // If the user is found, send the message username is taken
    if (found) {
      return res.status(400).json({ errorMessage: 'Username already taken.' });
    }

    // if user is not found, create a new user - start with hashing the password
    return bcrypt
      .genSalt(saltRounds)
      .then((salt) => bcrypt.hash(password, salt))
      .then((hashedPassword) => {
        // Create a user and save it in the database
        return User.create({
          username,
          password: hashedPassword,
          campus,
          course,
        });
      })
      .then((user) => {
        res.status(201).json(user);
      })
      .catch((error) => {
        if (error instanceof mongoose.Error.ValidationError) {
          return res.status(400).json({ errorMessage: error.message });
        }
        if (error.code === 11000) {
          return res.status(400).json({
            errorMessage:
              'Username need to be unique. The username you chose is already in use.',
          });
        }
        return res.status(500).json({ errorMessage: error.message });
      });
  });
});

router.post('/login', (req, res, next) => {
  const { username, password } = req.body;
  if (!username) {
    return res
      .status(400)
      .json({ errorMessage: 'Please provide your username.' });
  }

  // Here we use the same logic as above
  // - either length based parameters or we check the strength of a password
  // if (password.length < 8) {
  //   return res.status(400).json({
  //     errorMessage: 'Your password needs to be at least 8 characters long.',
  //   });
  // }

  // Search the database for a user with the username submitted in the form
  User.findOne({ username })
    .then((user) => {
      // If the user isn't found, send the message that user provided wrong credentials
      if (!user) {
        return res.status(400).json({ errorMessage: 'Wrong credentials.' });
      }

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt.compare(password, user.password).then((isSamePassword) => {
        if (!isSamePassword) {
          return res.status(400).json({ errorMessage: 'Wrong credentials.' });
        }
        // destructor the user without the password to use for the payload in the jwt
        const { _id, username, campus, course } = user;

        // Create an object that will be set as the token payload
        const payload = { _id, username, campus, course };

        // Create and sign the token
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: 'HS256',
          expiresIn: '6h',
        });

        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      });
    })
    .catch((err) => {
      // in this case we are sending the error handling to the error handling middleware that is defined in the error handling file
      // you can just as easily run the res.status that is commented out below
      next(err);
      // return res.status(500).render("login", { errorMessage: err.message });
    });
});

router.get('/logout', isLoggedIn, (req, res) => {
  console.log('logged out');
});

router.get('/verify', isAuthenticated, (req, res) => {
  // console.log(`req.payload`, req.payload);
  res.status(200).json(req.payload);
});

//dog routes
router.get('/fetch-pets', isAuthenticated, (req, res) => {
  PetModel.find()
    //populate the owners of the pets
    .populate('owner')
    //then filter all the pets to only the current users pets with the same _id
    .then((allPets) => {
      const ownerPets = allPets
        .filter((pet) => {
          const { owner } = pet;
          return req.payload._id == owner._id;
        })
        //remove the hashed password of the owner of the pets
        .map((pet) => {
          pet.owner.password = '****';
          return pet;
        });
      res.status(200).json(ownerPets);
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({ errorMessage: error.message });
    });
});

router.post('/create-pet', uploader.single('petImage'), (req, res) => {
  console.log(
    'here is the body for create pet',
    req.body,
    'image',
    req.file.path
  );
  const petToCreate = {
    ...req.body,
    petImage: req.file.path,
  };
  console.log('pet', petToCreate);
  if (!req.body.name) {
    return res
      .status(400)
      .json({ errorMessage: 'Please provide your pets name.' });
  }

  PetModel.create(petToCreate)
    .then((newPet) => {
      res.status(201).json(newPet);
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({ errorMessage: error.message });
    });
});

module.exports = router;
