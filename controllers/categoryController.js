const categoryModel = require('../models/categoryModel');

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await categoryModel.createCategory(name);
    res.status(201).json({ status: "success", data: category });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法建立分類" });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories();
    res.json({ status: "success", data: categories });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法獲取分類" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryModel.deleteCategory(id);
    res.json({ status: "success", message: "分類已刪除" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法刪除分類" });
  }
};
