/**
 * Compresses an image file by resizing it and reducing quality.
 * @param {File} file - The image file to compress.
 * @param {number} maxWidth - Maximum width of the output image.
 * @param {number} quality - Quality from 0 to 1 (e.g., 0.7).
 * @returns {Promise<string>} - A promise that resolves to the Base64 string of the compressed image.
 */
export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize logic
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export as JPEG with reduced quality
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
