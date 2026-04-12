const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractText(buffer, mimetype, originalFilename) {
  console.log(`fileParser: mimetype=${mimetype}, filename=${originalFilename}`);

  let effectiveMimetype = mimetype;
  if (mimetype === 'application/octet-stream' && originalFilename) {
    if (originalFilename.endsWith('.docx')) {
      effectiveMimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (originalFilename.endsWith('.pdf')) {
      effectiveMimetype = 'application/pdf';
    }
  }

  if (effectiveMimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (
    effectiveMimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    effectiveMimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(`Unsupported file type: ${effectiveMimetype}`);
}

module.exports = { extractText };
