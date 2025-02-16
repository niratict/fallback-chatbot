const admin = require("firebase-admin");

// ฟังก์ชันเริ่มต้นการเชื่อมต่อกับ Firebase
const initializeFirebase = () => {
  // กำหนดค่า service account สำหรับการเชื่อมต่อ Firebase
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  };

  try {
    // เริ่มต้นแอพ Firebase
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    const db = admin.database();
    setupFirebaseListeners(db);
    return db;
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการเริ่มต้น Firebase:", error);
    process.exit(1);
  }
};

// ตั้งค่า listeners สำหรับการเชื่อมต่อ Firebase
const setupFirebaseListeners = (db) => {
  db.ref(".info/connected").on("value", async (snapshot) => {
    if (snapshot.val() === true) {
      console.log("✅ เชื่อมต่อกับ Firebase Realtime Database สำเร็จ");
      await updateSystemStatus(db);
    }
  });
};

// อัพเดทสถานะระบบใน Firebase
const updateSystemStatus = async (db) => {
  try {
    await db.ref("system_status").set({
      last_connection: new Date().toISOString(),
      status: "online",
    });
    console.log("✅ บันทึกสถานะระบบสำเร็จ");
  } catch (error) {
    console.error("❌ ไม่สามารถบันทึกสถานะระบบได้:", error);
  }
};

module.exports = { initializeFirebase };
