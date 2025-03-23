"use server"

// Image size presets for optimization

import supabase from "./supabase"
import { ImageSize, IMAGE_SIZES } from "./types"
import sharp from "sharp"

/**
 * Optimizes an image using Sharp
 * Converts to WebP format and resizes to the specified dimensions
 */
async function optimizeImage(file: File, size: ImageSize = 'medium'): Promise<Buffer> {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Get dimensions for the requested size
    const dimensions = IMAGE_SIZES[size]
    
    // Process the image with Sharp
    let sharpInstance = sharp(buffer).webp({ quality: 80 })
    
    // Only resize if dimensions are provided (not original)
    if (dimensions.width && dimensions.height) {
      sharpInstance = sharpInstance.resize({
        width: dimensions.width,
        height: dimensions.height,
        fit: 'inside',
        withoutEnlargement: true
      })
    }
    
    return sharpInstance.toBuffer()
  }
  
  /**
   * Uploads an optimized image to Supabase Storage
   * Returns an object with URLs for all generated sizes
   */
  export async function uploadOptimizedImage(
    file: File, 
    sizes: ImageSize[] = ['medium'], 
    bucket: string = 'blog-images', 
    folder: string = ''
  ): Promise<Record<ImageSize, string>> {
    // Generate base filename without extension
    const baseFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
    const results: Record<ImageSize, string> = {} as Record<ImageSize, string>
    
    // Process each requested size
    for (const size of sizes) {
      try {
        // Optimize the image
        const optimizedBuffer = await optimizeImage(file, size)
        
        // Create file path with size suffix
        const filePath = folder 
          ? `${folder}/${baseFileName}_${size}.webp` 
          : `${baseFileName}_${size}.webp`
        
        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, optimizedBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600'
          })
        
        if (error) {
          throw new Error(`Error uploading ${size} image: ${error.message}`)
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)
        
        results[size] = publicUrl
      } catch (error) {
        console.error(`Failed to process ${size} image:`, error)
        throw error
      }
    }
    
    return results
  }
  
  // Original helper function to upload a file to Supabase Storage
  export async function uploadFile(file: File, bucket: string = 'blog-images', folder: string = '') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    
    // Create file path with folder if provided
    const filePath = folder 
      ? `${folder}/${fileName}` 
      : fileName
  
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)
  
    if (error) {
      throw new Error(error.message)
    }
  
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
  
    return publicUrl
  }