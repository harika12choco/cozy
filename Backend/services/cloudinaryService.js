const crypto = require("crypto");

function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (!cloudinaryUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(cloudinaryUrl);

    return {
      cloudName: parsedUrl.hostname,
      apiKey: decodeURIComponent(parsedUrl.username),
      apiSecret: decodeURIComponent(parsedUrl.password)
    };
  } catch (error) {
    throw new Error("Invalid CLOUDINARY_URL");
  }
}

function isDataUri(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

function createSignature(params, apiSecret) {
  const signaturePayload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${signaturePayload}${apiSecret}`)
    .digest("hex");
}

function createProductImageSignature() {
  const config = getCloudinaryConfig();

  if (!config) {
    throw new Error("Cloudinary is not configured. Add CLOUDINARY_URL to Backend/.env");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "cozy-candles/products";
  const signature = createSignature({ folder, timestamp }, config.apiSecret);

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder,
    timestamp,
    signature
  };
}

async function uploadProductImage(image) {
  if (!isDataUri(image)) {
    return { image };
  }

  const config = getCloudinaryConfig();

  if (!config) {
    throw new Error("Cloudinary is not configured. Add CLOUDINARY_URL to Backend/.env");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const uploadParams = {
    folder: "cozy-candles/products",
    timestamp
  };
  const signature = createSignature(uploadParams, config.apiSecret);
  const body = new FormData();

  body.append("file", image);
  body.append("api_key", config.apiKey);
  body.append("folder", uploadParams.folder);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: "POST",
      body
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message ?? "Cloudinary upload failed");
  }

  return {
    image: result.secure_url,
    imagePublicId: result.public_id
  };
}

module.exports = {
  createProductImageSignature,
  uploadProductImage
};
