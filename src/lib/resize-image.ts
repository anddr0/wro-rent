// Shrinks a photo in the browser before upload: a phone photo is 3–10 MB and
// 4000 pixels wide, the catalog needs a fraction of that. Returns a JPEG
// whose longer side is at most `maxSide` pixels.
export async function resizeImage(file: File, maxSide: number): Promise<Blob> {
  const image = await loadImage(file);

  let scale = maxSide / Math.max(image.naturalWidth, image.naturalHeight);
  if (scale > 1) {
    // A small photo stays its size, it is only re-saved as JPEG.
    scale = 1;
  }
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported");
  }
  // JPEG has no transparency: a see-through PNG would turn black without this.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not encode the photo"));
        }
      },
      "image/jpeg",
      0.85,
    );
  });
}

// Reads a file into an <img>. Rejects when the file isn't an image
// the browser can show.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the photo"));
    };
    image.src = url;
  });
}
