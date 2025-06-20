export const generateBarcode = (productId) => {
  // Generate a simple barcode based on product ID
  // In production, you might want to use a more sophisticated barcode generation
  const timestamp = Date.now().toString().slice(-6);
  const productIdStr = productId.toString().slice(-6);
  return `EMT${productIdStr}${timestamp}`;
};

export const validateBarcode = (barcode) => {
  // Basic barcode validation
  return /^EMT\d{12}$/.test(barcode);
};