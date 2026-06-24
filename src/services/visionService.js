const vision = require('@google-cloud/vision');

if (!process.env.GOOGLE_CREDENTIALS_JSON) {
  throw new Error('[visionService] GOOGLE_CREDENTIALS_JSON environment variable is not set');
}

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
const visionClient = new vision.ImageAnnotatorClient({ credentials });

async function extractTextFromImage(imageBuffer) {
  const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    return null;
  }

  return detections[0].description;
}

module.exports = { extractTextFromImage };
