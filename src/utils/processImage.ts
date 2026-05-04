import imageCompression from "browser-image-compression";
import { isSupportedImageFile } from "@/config/imageUpload";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface ProcessImageOptions {
  allowLarger?: boolean; // Allow >1MB for master plan images
  maxSizeMB?: number; // Override default max size
  maxWidthOrHeight?: number; // Override default max dimension
}

/**
 * Process and compress image with unified settings across the app
 * 
 * @param file - Image file to process
 * @param options - Processing options
 * @returns Promise<File> - Processed image file
 */
export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<File> {
  // Validate file type
  if (!isSupportedImageFile(file)) {
    throw new Error("Unsupported file type. Only JPEG, PNG, and WebP are allowed.");
  }

  // Reject extremely large files (>10MB) to prevent memory issues
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size exceeds 10MB. Please choose a smaller file.");
  }

  // Set target max size - allowLarger only affects size limit, not dimensions
  const targetMaxSize = options.maxSizeMB ?? (options.allowLarger ? 5 : 1);

  // Determine output format - try WebP for better compression
  const originalType = file.type;
  let outputType = originalType;
  
  // Only convert to WebP if original is JPEG or PNG (not already WebP)
  if (originalType === "image/jpeg" || originalType === "image/png") {
    outputType = "image/webp";
  }

  // Compression configuration with balanced approach
  const compressionOptions = {
    maxSizeMB: targetMaxSize,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
    useWebWorker: true,
    fileType: outputType,
    initialQuality: 0.9, // Start with high quality
  };

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[processImage] Processing ${file.name}, original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }
    
    let compressedFile = await imageCompression(file, compressionOptions);
    
    // If WebP conversion failed, fall back to original format
    if (outputType !== originalType && compressedFile.type !== outputType) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[processImage] WebP conversion failed for ${file.name}, falling back to ${originalType}`);
      }
      const fallbackOptions = { ...compressionOptions, fileType: originalType };
      compressedFile = await imageCompression(file, fallbackOptions);
    }
    
    // If still too large, progressively reduce quality
    let quality = 0.9;
    while (compressedFile.size > targetMaxSize * 1024 * 1024 && quality > 0.1) {
      quality -= 0.1;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[processImage] Reducing quality to ${quality.toFixed(1)} for ${file.name}`);
      }
      
      const retryOptions = {
        ...compressionOptions,
        initialQuality: quality,
        fileType: compressedFile.type, // Keep the format that worked
      };
      
      const retryFile = await imageCompression(file, retryOptions);
      if (retryFile.size < compressedFile.size) {
        compressedFile = retryFile;
      } else {
        break; // No improvement, stop trying
      }
    }
    
    // FINAL STRICT CHECK: If still too large, retry with stronger compression
    if (compressedFile.size > targetMaxSize * 1024 * 1024) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[processImage] Final size check failed for ${file.name}, retrying with stronger compression`);
      }
      const strongCompressionOptions = {
        ...compressionOptions,
        initialQuality: 0.5, // Lower quality for final attempt
        fileType: originalType, // Use original format for compatibility
      };
      
      const finalFile = await imageCompression(file, strongCompressionOptions);
      if (finalFile.size <= targetMaxSize * 1024 * 1024) {
        compressedFile = finalFile;
      } else {
        // If still too large after strong compression, throw error
        throw new Error(`Unable to compress ${file.name} to required size. Final size: ${(finalFile.size / 1024 / 1024).toFixed(2)}MB, target: ${targetMaxSize}MB`);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[processImage] Processed ${file.name}, final size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB, format: ${compressedFile.type}`);
    }
    
    return compressedFile;
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[processImage] Compression failed for ${file.name}:`, error);
    }
    
    // Fallback: try with original format and lower quality
    try {
      const fallbackOptions = {
        maxSizeMB: targetMaxSize,
        maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
        useWebWorker: true,
        fileType: originalType,
        initialQuality: 0.7,
      };
      
      const fallbackFile = await imageCompression(file, fallbackOptions);
      
      // Apply same guarantee to fallback path
      if (fallbackFile.size > targetMaxSize * 1024 * 1024) {
        // Try stronger compression in fallback
        const strongFallbackOptions = {
          ...fallbackOptions,
          initialQuality: 0.4,
        };
        const strongFallbackFile = await imageCompression(file, strongFallbackOptions);
        
        if (strongFallbackFile.size <= targetMaxSize * 1024 * 1024) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[processImage] Fallback compression with stronger quality succeeded for ${file.name}`);
          }
          return strongFallbackFile;
        } else {
          throw new Error(`Unable to compress ${file.name} to required size even in fallback. Final size: ${(strongFallbackFile.size / 1024 / 1024).toFixed(2)}MB, target: ${targetMaxSize}MB`);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[processImage] Fallback compression succeeded for ${file.name}`);
      }
      return fallbackFile;
      
    } catch (fallbackError) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[processImage] Fallback compression also failed for ${file.name}:`, fallbackError);
      }
      
      // Last resort: byte limit already satisfied — try a dimension-only pass before returning raw file
      if (file.size <= targetMaxSize * 1024 * 1024) {
        const maxDim = options.maxWidthOrHeight ?? 1920;
        try {
          const resizePass = await imageCompression(file, {
            maxSizeMB: Math.max(targetMaxSize, 2),
            maxWidthOrHeight: maxDim,
            useWebWorker: true,
            fileType: originalType,
            initialQuality: 0.85,
          });
          if (resizePass.size <= targetMaxSize * 1024 * 1024) {
            return resizePass;
          }
          const strictResize = await imageCompression(file, {
            maxSizeMB: targetMaxSize,
            maxWidthOrHeight: maxDim,
            useWebWorker: true,
            fileType: originalType,
            initialQuality: 0.45,
          });
          if (strictResize.size <= targetMaxSize * 1024 * 1024) {
            return strictResize;
          }
        } catch {
          // fall through to original file
        }
        if (process.env.NODE_ENV === 'development') {
          console.log(`[processImage] Using original file for ${file.name} (within size limit)`);
        }
        return file;
      }
      
      throw new Error(`Failed to process image: ${getErrorMessage(error)}`);
    }
  }
}

/**
 * Process image for normal upload (strict 1MB limit)
 */
export async function processNormalImage(file: File): Promise<File> {
  return processImage(file, { allowLarger: false });
}

/**
 * Process image for master plan upload (allows larger files)
 */
export async function processMasterPlanImage(file: File): Promise<File> {
  return processImage(file, { allowLarger: true, maxSizeMB: 5 });
}
