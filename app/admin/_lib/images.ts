// Shrinks a photo in the browser before upload: phone photos are often 5-10 MB, which is slow to
// upload and to show on the website. Result: at most 1600px wide/tall, WebP (or JPEG where the
// browser can't make WebP, e.g. older Safari).

const MAX_SIZE = 1600;

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image can't be read. Try a JPG or PNG.");
  });
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Couldn't prepare the image.");
  return jpeg;
}

/** Uploads a car photo; returns the URL to store. */
export async function uploadCarPhoto(file: File, upload: (form: FormData) => Promise<{ url: string }>) {
  const blob = await compressImage(file);
  const form = new FormData();
  form.append("file", blob, blob.type === "image/webp" ? "photo.webp" : "photo.jpg");
  return (await upload(form)).url;
}
