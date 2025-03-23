"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadOptimizedImage, uploadFile } from '@/lib/imageUtils'
import { X, Upload, Image, Link } from 'lucide-react'
import { toast } from 'sonner'

// Define ImageSize type locally instead of importing from supabase
export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original'

interface BlogImageUploadProps {
  value: string
  onChange: (url: string, allSizes?: Record<ImageSize, string>) => void
  disabled?: boolean
}

export function BlogImageUpload({ value, onChange, disabled = false }: BlogImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [mode, setMode] = useState<'upload' | 'url'>(value ? 'url' : 'upload')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      
      // Upload and optimize the image in multiple sizes
      const sizes = ['thumbnail', 'small', 'medium', 'large'] as ImageSize[]
      const imageUrls = await uploadOptimizedImage(file, sizes, 'blog-images', 'covers')
      
      // Use the medium size as the default
      const defaultUrl = imageUrls.medium
      
      onChange(defaultUrl, imageUrls)
      setMode('url')
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value)
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    
    // Basic validation for URL
    try {
      new URL(urlInput)
      onChange(urlInput)
      setUrlInput('')
      toast.success('Image URL set')
    } catch (error) {
      toast.error('Please enter a valid URL')
    }
  }

  const handleClear = () => {
    onChange('')
    setUrlInput('')
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative rounded-md overflow-hidden border border-sky-500/20">
          <img 
            src={value} 
            alt="Cover" 
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Show fallback for broken images
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image'
            }}
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant={mode === 'upload' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setMode('upload')}
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button 
              type="button" 
              variant={mode === 'url' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setMode('url')}
              disabled={disabled}
            >
              <Link className="h-4 w-4 mr-2" />
              URL
            </Button>
          </div>

          {mode === 'upload' ? (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="image-upload" className="sr-only">
                Upload Image
              </Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading || disabled}
                className="cursor-pointer"
              />
              {uploading && (
                <p className="text-sm text-muted-foreground">
                  Uploading and optimizing...
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="image-url" className="sr-only">
                  Image URL
                </Label>
                <Input
                  id="image-url"
                  type="text"
                  placeholder="Enter image URL"
                  value={urlInput}
                  onChange={handleUrlChange}
                  disabled={disabled}
                />
              </div>
              <Button type="submit" size="sm" disabled={!urlInput.trim() || disabled}>
                Set
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
} 