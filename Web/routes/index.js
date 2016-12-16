var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/sphere', function(req, res, next) {
    res.render('sphere', { title: 'Express' });
});

router.get('/planet', function(req, res, next) {
    res.render('planet', { title: 'Express' });
});


module.exports = router;
