const subscriptionModel = require('../models/subscriptionModel');

exports.createSubscription = async (req, res) => {
  try {
    const { subscribed_to } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    if (req.user.id === subscribed_to) {
      return res.status(400).json({ status: "error", message: "無法訂閱自己" });
    }

    const subscription = await subscriptionModel.createSubscription(req.user.id, subscribed_to);
    res.status(201).json({ status: "success", data: subscription });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message || "無法建立訂閱" });
  }
};

exports.getSubscriptionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptions = await subscriptionModel.getSubscriptionsByUser(userId);
    res.json({ status: "success", data: subscriptions });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法獲取訂閱清單" });
  }
};

exports.getFollowersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await subscriptionModel.getFollowersByUser(userId);
    res.json({ status: "success", data: followers });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法獲取追蹤者名單" });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    await subscriptionModel.deleteSubscription(id);
    res.json({ status: "success", message: "已取消訂閱" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法取消訂閱" });
  }
};
