// ฟังก์ชันแปลงเวลาเป็นเวลาประเทศไทย
const getThaiTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
};

// ฟังก์ชันตรวจสอบว่าอยู่ในเวลาทำการหรือไม่
const isWithinBusinessHours = () => {
  const thaiTime = getThaiTime();
  const day = thaiTime.getDay();
  const hour = thaiTime.getHours();
  const minutes = thaiTime.getMinutes();
  const currentTime = hour + minutes / 60;

  // ตรวจสอบเวลาทำการตามวัน
  if (day === 0) return currentTime >= 9 && currentTime < 18; // วันอาทิตย์ 9:00-18:00
  if (day >= 1 && day <= 6) return currentTime >= 9 && currentTime < 24; // จันทร์-เสาร์ 9:00-24:00
  return false;
};

module.exports = { getThaiTime, isWithinBusinessHours };
