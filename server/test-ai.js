const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
// En olası adayları sırayla deneyeceğiz
const candidates = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-latest",
  "gemini-pro",
  "gemini-1.0-pro",
  "gemini-2.0-flash-exp"
];

async function huntWorkingModel() {
  console.log("🔍 Model Avı Başlatılıyor...\n");

  for (const model of candidates) {
    process.stdout.write(`👉 Deneniyor: ${model.padEnd(25)} ... `);
    
    try {
      // Doğrudan REST API üzerinden üretim denemesi yapıyoruz (SDK'yı bypass ediyoruz)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      await axios.post(url, {
        contents: [{ parts: [{ text: "Hello, are you working?" }] }]
      });

      console.log("✅ ÇALIŞIYOR! (Bunu kullanacağız)");
      console.log("\n🎯 KAZANAN MODEL: " + model);
      console.log("------------------------------------------------");
      console.log(`Lütfen 'server/routes/ai.js' dosyasına gidip model kısmını şununla değiştir:`);
      console.log(`model: "${model}"`);
      console.log("------------------------------------------------");
      return; // Çalışanı bulduk, çıkabiliriz

    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("❌ 404 (Bulunamadı)");
      } else {
        console.log(`❌ HATA: ${error.response ? error.response.status : error.message}`);
      }
    }
  }

  console.log("\n⚠️ Hiçbir model çalışmadı. API Anahtarında veya Bölgesel bir kısıtlama olabilir.");
}

huntWorkingModel();