// Görseli yüklemeden önce tarayıcıda küçültür.
// Sunucu (Vercel) 4 MB'tan büyük istekleri kabul etmediği için büyük fotoğraflar
// en fazla 1600 px genişliğe indirilip WebP olarak yeniden kodlanır.

const MAX_WIDTH = 1600;
const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class ImageError extends Error {}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('Görsel okunamadı'));
    };
    img.src = url;
  });
}

/** { blob, filename } döner. GIF'ler (animasyon bozulmasın diye) olduğu gibi bırakılır. */
export async function prepareImage(file) {
  if (!ACCEPTED.includes(file.type)) {
    throw new ImageError('Yalnızca JPEG, PNG, WebP veya GIF görseller yüklenebilir');
  }
  if (file.type === 'image/gif') {
    if (file.size > MAX_BYTES) throw new ImageError('GIF en fazla 4 MB olabilir');
    return { blob: file, filename: file.name };
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
  if (scale === 1 && file.size <= MAX_BYTES / 2) {
    return { blob: file, filename: file.name };
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob || blob.size > MAX_BYTES) {
    throw new ImageError('Görsel çok büyük, daha küçük bir görsel seçin');
  }
  return { blob, filename: 'kapak.webp' };
}
