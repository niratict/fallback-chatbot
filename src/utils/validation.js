// ฟังก์ชันตรวจสอบความถูกต้องของข้อมูล
const validateInput = (input, type) => {
  switch (type) {
    case "number":
      return !isNaN(input) && input !== null && input !== undefined;
    case "string":
      return typeof input === "string" && input.trim().length > 0;
    case "object":
      return input !== null && typeof input === "object";
    default:
      return false;
  }
};

const sanitizeInput = (input) => {
  if (typeof input === "string") {
    // ทำความสะอาดข้อความ input
    return input.trim().replace(/[<>]/g, "");
  }
  return input;
};

module.exports = { validateInput, sanitizeInput };
