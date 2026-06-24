const vision = require('@google-cloud/vision');

const visionClient = new vision.ImageAnnotatorClient();

async function extractTextFromImage(imageBuffer) {
  const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    return null;
  }

  return detections[0].description;
}

module.exports = { extractTextFromImage };
