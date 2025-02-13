const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, subscriptionController.createSubscription);
router.get('/user/:userId', authMiddleware, subscriptionController.getSubscriptionsByUser);
router.get('/followers/:userId', authMiddleware, subscriptionController.getFollowersByUser);
router.delete('/:id', authMiddleware, subscriptionController.deleteSubscription);

module.exports = router;
