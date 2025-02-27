const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../config-s3");


// **代理Cloud flare產生 Cloudflare R2圖片簽名網址**
exports.proxyImage = async (req, res) => {
  try {
    const fileKey = decodeURIComponent(req.query.key); // ✅ 確保 URL 解析正確
    if (!fileKey) return res.status(400).json({ error: "缺少圖片 key" });

    // ✅ 直接產生新的簽名 URL（但 Cloudflare Workers 會負責快取，避免頻繁請求）
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 7 天有效
    console.log("📌 Render Server 取得 R2 簽名 URL:", signedUrl);

    const imageResponse = await fetch(signedUrl);
    if (!imageResponse.ok) throw new Error("圖片獲取失敗");
  
    // 取得 Content-Type
    const contentType = imageResponse.headers.get("Content-Type");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");

    // ✅ 轉換 fetch Response Body 為 Node.js 可讀流
    const stream = Readable.from(imageResponse.body);
    // imageResponse.body.pipe(res);
    console.log("✅ Render Server 直接回應圖片");
    stream.pipe(res);
  } catch (error) {
    console.error("圖片代理錯誤:", error);
    res.status(500).json({ error: "無法取得圖片" });
  }
};
