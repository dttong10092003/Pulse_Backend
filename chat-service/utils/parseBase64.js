const parseBase64 = (base64String) => {
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
  
    const mimeType = matches[1]; // ví dụ: image/png
    const base64Data = matches[2]; // phần sau dấu phẩy
  
    const buffer = Buffer.from(base64Data, 'base64');
    return { mimeType, buffer };
  };

exports.parseBase64 = parseBase64;