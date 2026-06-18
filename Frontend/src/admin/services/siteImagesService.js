import { requestJson } from "./http";

async function getSignature() {
  return requestJson("/site-images/cloudinary/signature");
}

async function uploadImage(file) {
  const signature = await getSignature();
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("folder", signature.folder);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message ?? "Cloudinary upload failed");
  }

  return result.secure_url;
}

export const siteImagesService = {
  async get() {
    return requestJson("/site-images", { cache: "no-store" });
  },

  async update(payload) {
    return requestJson("/site-images", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },

  uploadImage
};
