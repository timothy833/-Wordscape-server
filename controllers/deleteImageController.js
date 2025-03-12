const { s3 } = require("../config-s3");
const {DeleteObjectCommand} = require("@aws-sdk/client-s3");

exports.deleteFromR2 = async(fileKey) => {
    try {
        if(!fileKey) throw new Error("❌ 缺少要刪除的圖片 key");

        // 初始化刪除請求
        const deleteParams = {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
        };

        //送出刪除請求
        const command = new DeleteObjectCommand(deleteParams);
        await s3.send(command);
        console.log(`✅ 圖片刪除成功: ${fileKey}`);

        // ✅ **清除 Cloudflare Cache**
        await purgeCloudflareCache(fileKey);
        console.log(`✅ 圖片快取刪除成功: ${fileKey}`);

        return true;
    } catch (error) {
        console.error("❌ 刪除 R2 內圖片錯誤:",  error);
        return false;
    }
};

//刪除R2快取圖片
const purgeCloudflareCache = async(fileKey)=>{
    try {
        const purgeUrl = `${process.env.CDN_BASE_URL}/api/image?key=${encodeURIComponent(fileKey)}`;

        console.log(`🚀 清除 Cloudflare 快取: ${purgeUrl}`);

        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, // ✅ 使用 API Token
                "Content-Type": "application/json",
            },
            body: JSON.stringify({files: [purgeUrl]}),
        });

        const data = await response.json();
        if(data.sucess){
            console.log(`✅ Cloudflare 快取已清除: ${purgeUrl}`);
        }else {
            console.error("❌ Cloudflare 快取清除失敗:", data.error);
        }

    } catch (error) {
        console.log("❌ Cloudflare 快取清除 API 錯誤:", error);
    }
}