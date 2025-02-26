const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../config-s3");


// **代理Cloud flare產生 Cloudflare R2圖片簽名網址**
exports.proxyImage = async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "缺少圖片 key" });

    // ✅ 直接產生新的簽名 URL（但 Cloudflare Workers 會負責快取，避免頻繁請求）
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 7 天有效

    return res.json({ signedUrl });
  } catch (error) {
    console.error("圖片代理錯誤:", error);
    res.status(500).json({ error: "無法取得圖片" });
  }
};
