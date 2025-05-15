import imageCompression from "browser-image-compression";

export const compressImage = async (file) => {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.7,
    };

    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error("Error compressing image:", error);
        // If compression fails, return the original file
        return file;
    }
};