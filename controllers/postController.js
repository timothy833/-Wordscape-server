const postModel = require('../models/postModel');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const path = require("path");

//設定 Cloudflare R2
const s3 = new S3Client({
  region: "auto", // Cloudflare R2 不需要設定特定區域
  endpoint: process.env.R2_ENDPOINT, // Cloudflare R2 API 端點
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});



 // **通用 R2 上傳函式（支援 Base64 & 檔案）**
const uploadToR2 = async (file, folder) =>{
  try {
    let fileBuffer; // 先宣告變數
    let fileName;

    if(typeof file === "string" && file.startsWith("data:image")) {
      // Base64 圖片處理
      const base64Data =  file.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
      fileName = `${folder}/${Date.now()}.png`; // **確保唯一檔名**
    } 
    else if (file.path) {
      //正常檔案上傳 ✅ 處理一般檔案上傳
     fileBuffer = fs.readFileSync(file.path);
     fileName = `${folder}/${Date.now()}-${file.originalname}`; // 保留原始檔名
    }
    else {
      throw new Error("無效的圖片格式");
    }

    //初始化  ✅ 設定上傳參數 **上傳到 R2**
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName, 
      Body: fileBuffer,
      ContentType: file.mimetype || "image/png",
    }


    // ✅ 使用 `PutObjectCommand`
    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    console.log("✅ 圖片成功上傳到 R2");
    
    // 上傳成功後刪除本地檔案
   // ✅ 確保刪除本地檔案
   if (file.path) {
    fs.unlink(file.path, (err) => {
      if (err) console.error("❌ 刪除本地檔案失敗:", err);
      else console.log("✅ 本地檔案刪除成功:", file.path);
    });
  }
    console.log("📌 圖片已成功上傳，返回的 URL:", fileName);

    // **本地 vs 雲端 儲存不同 URL**
    const resultUrl = process.env.NODE_ENV === "development"
    ? await getSignedUrl(s3, new GetObjectCommand(uploadParams), { expiresIn: 604800 })
    : `${process.env.CDN_BASE_URL}/api/proxy/image?key=${fileName}`;

    console.log("📌 返回的圖片 URL:", resultUrl);
    return resultUrl;
  } catch (error) {
    console.error(`圖片上傳錯誤: ${error}`);
    throw new Error("圖片上傳失敗");
  }
}


// **批量處理圖片上傳**
const processBatchUpload = async (images, folder) => {
  const urls = [];

  for (const file of images) {
    if (typeof file === "string" && file.startsWith("http")) {
      urls.push(file);
    } else {
      const url = await uploadToR2(file, folder);
      urls.push(url);
    }
  }

  return urls;
};


// **封面圖片上傳 API**
exports.uploadCoverImage = async (req, res) => {
  try {
    const file = req.file || req.body.file;

    // ✅ 如果是外部圖片，直接返回 URL，不上傳
    if (typeof file === "string" && file.startsWith("http")) {
      return res.json({ url: file });
    }

    const imageUrl = await uploadToR2(file, "cover_images");
    res.json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// **文章內圖片上傳 API**
exports.uploadContentImage = async (req, res) => {
  try {
    const files = req.body.files; // Base64 陣列
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "缺少圖片數據" });
    }
    console.log("📌 收到的 Base64 圖片數量:", files.length);
    const uploadedUrls = await processBatchUpload(files, "content_images");
    console.log("📌 上傳後的 R2 URL:", uploadedUrls);
    res.json({ urls: uploadedUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **代理 Cloudflare R2 讀取圖片**
exports.proxyImage = async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "缺少圖片 key" });

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });


    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 7 天簽名 URL

    return res.redirect(signedUrl);// 使用快取模式讀取簽名url
  } catch (error) {
    console.error("圖片代理錯誤:", error);
    res.status(500).json({ error: "無法取得圖片" });
  }
};

// **取得所有文章**
exports.getPosts = async (req, res) => {
  try {
    const posts = await postModel.getPosts();
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得文章列表:", error);
    res.status(500).json({ status: "error", message: "無法取得文章" });
  }
};

 // **根據 ID 取得文章**
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postModel.getPostById(id);
    if (!post) {
      return res.status(404).json({ status: "error", message: "文章不存在" });
    }
    res.json({ status: "success", data: post });
  } catch (error) {
    console.error("無法取得文章:", error);
    res.status(500).json({ status: "error", message: "無法取得文章" });
  }
};

exports.getPostsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const posts = await postModel.getPostsByCategory(categoryId);
    if (posts.length === 0) {
      return res.status(404).json({ status: "error", message: "此分類下沒有文章" });
    }
    res.json({ status: "success", data: posts });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法取得分類文章" });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await postModel.getPostsByUser(userId);
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得使用者文章:", error);
    res.status(500).json({ status: "error", message: "無法取得使用者文章" });
  }
};

exports.getFullPostsWithComments = async (req, res) => {
  try {
    const posts = await postModel.getFullPostsWithComments();
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得完整文章列表:", error);
    res.status(500).json({ status: "error", message: "無法取得完整文章列表" });
  }
};


//**建立文章**
exports.createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const { title, content, category_id, status, tags, image_url } = req.body;

    if(!title || !content) {
      return res.status(400).json({error: "標題與內容為必填"});
    }


    const postData = {
      id: uuidv4(),
      user_id: req.user.id,
      category_id,
      title,
      content, // 這裡已經是處理過的 HTML，內含 R2 圖片 URL
      status: status || 'draft',
      image_url: image_url|| null // ✅ 存入轉換後的 URL
    };

    console.log("📌 正在新增文章"); // 🔴 **加上 log 檢查**

    const newPost = await postModel.createPost(postData, tags || []);
    console.log("✅ 文章新增成功:", newPost); // 🔴 **確認這裡是否有成功執行**
    res.status(201).json({ status: "success", data: newPost });
  } catch (error) {
    console.error("❌ 文章建立失敗:", error); // 🔴 **顯示錯誤細節**
    res.status(500).json({ status: "error", message: "無法新增文章" });
  }
};

// **更新文章**
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updatedPost = await postModel.updatePost(id, { title, content });

    if (!updatedPost) {
      return res.status(404).json({ status: "error", message: "文章不存在" });
    }

    res.json({ status: "success", data: updatedPost });
  } catch (error) {
    console.error("更新文章失敗:", error);
    res.status(500).json({ status: "error", message: "無法更新文章" });
  }
};


// **刪除文章**
exports.deletePost = async (req, res) => {
  try {
    const deletedPost = await postModel.getPostById(req.params.id);
    if (!deletedPost) return res.status(404).json({ status: "error", message: "找不到文章" });

    await postModel.deletePost(req.params.id);
    res.json({ status: "success", message: "文章已刪除" });
  } catch (error) {
    console.error("刪除文章失敗:", error);
    res.status(500).json({ status: "error", message: "無法刪除文章" });
  }
};

exports.addTagsToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ status: "error", message: "請提供有效的標籤陣列" });
    }

    const addedTags = await postModel.addTagsToPost(id, tags);
    res.json({ status: "success", data: { post_id: id, tags: addedTags } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法新增標籤" });
  }
};

exports.searchPostsByTags = async (req, res) => {
  try {
    const { tags } = req.query;
    if (!tags) {
      return res.status(400).json({ status: "error", message: "請提供標籤參數" });
    }

    const tagArray = tags.split(',');
    const posts = await postModel.searchPostsByTags(tagArray);
    res.json({ status: "success", data: posts });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法搜尋文章" });
  }
};

exports.togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({ status: "error", message: "缺少 postId" });
    }

    const result = await postModel.togglePostLike(userId, postId);
    res.json({ status: "success", liked: result.liked });
  } catch (error) {
    console.error("按讚失敗:", error);
    res.status(500).json({ status: "error", message: "操作失敗" });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const { post_id } = req.params;
    const likes = await postModel.getPostLikes(post_id);

    if (!likes) {
      return res.status(404).json({ status: "error", message: "找不到該文章的按讚數" });
    }

    res.json({ status: "success", data: likes });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法查詢按讚數" });
  }
};
