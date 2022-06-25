const router = require('express').Router();

/* GET home page */
router.get('/', (req, res, next) => {
  res.json('All good in here');
});

router.put('users', (req, res) => {});

router.get('users', (req, res) => {});

router.post('upload', (req, res) => {
  console.log('Here is the req body', req.body);
});

module.exports = router;
