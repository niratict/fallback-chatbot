// ฟังก์ชันคำนวณผลลัพธ์ทางคณิตศาสตร์
const calculateResult = (num1, operator, num2) => {
    switch (operator) {
      case "+": return num1 + num2;
      case "-": return num1 - num2;
      case "*": return num1 * num2;
      case "/": return num2 !== 0 ? num1 / num2 : null; // ป้องกันการหารด้วย 0
      default: return null;
    }
  };
  
  module.exports = { calculateResult };