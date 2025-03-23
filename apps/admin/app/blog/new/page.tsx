"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBlogPost, getCategories, getTags } from "../../../actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { MultiSelect } from "@/components/ui/multi-select"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { Skeleton } from "@/components/ui/skeleton"
import { BlogImageUpload, ImageSize } from "@/components/blog-image-upload"

export default function NewBlogPost() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Post data
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)
  const [featured, setFeatured] = useState(false)
  
  // Image sizes for responsive display
  const [allImageSizes, setAllImageSizes] = useState<Record<ImageSize, string> | null>(null)
  
  // Categories and tags
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<any[]>([])
  const [availableTags, setAvailableTags] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and tags in parallel
        const [categoriesData, tagsData] = await Promise.all([
          getCategories(),
          getTags()
        ])
        
        // Set available categories and tags
        setAvailableCategories(categoriesData.map((cat: any) => ({
          value: cat.id,
          label: cat.name
        })))
        
        setAvailableTags(tagsData.map((tag: any) => ({
          value: tag.id,
          label: tag.name
        })))
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load categories and tags')
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    
    // Auto-generate slug if it's empty or matches the previous title
    if (!slug || slug === e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) {
      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure slug only contains lowercase letters, numbers, and hyphens
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }
  
  const handleContentChange = (value: string) => {
    // Ensure we preserve all whitespace
    setContent(value)
  }
  
  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExcerpt(e.target.value)
  }
  
  const handleCoverImageChange = (url: string, allSizes?: Record<ImageSize, string>) => {
    setCoverImage(url)
    if (allSizes) {
      setAllImageSizes(allSizes)
    } else {
      setAllImageSizes(null)
    }
  }
  
  const handleCategoryChange = (values: string[]) => {
    setSelectedCategories(values)
  }
  
  const handleTagChange = (values: string[]) => {
    setSelectedTags(values)
  }
  
  const handlePublishedChange = (checked: boolean) => {
    setPublished(checked)
  }
  
  const handleFeaturedChange = (checked: boolean) => {
    setFeatured(checked)
  }
  
  const handleSave = async () => {
    if (!title) {
      toast.error('Title is required')
      return
    }
    
    if (!slug) {
      toast.error('Slug is required')
      return
    }
    
    if (!content) {
      toast.error('Content is required')
      return
    }
    
    try {
      setSaving(true)
      
      // Prepare the post data
      const postData: any = {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        published,
        featured,
        authorId: "current-user",
        categoryIds: selectedCategories,
        tagIds: selectedTags
      }
      
      // Add image sizes metadata if available
      if (allImageSizes) {
        postData.imageSizes = JSON.stringify(allImageSizes)
      }
      
      const newPost = await createBlogPost(postData)
      
      toast.success('Blog post created successfully')
      router.push(`/blog/edit/${newPost.id}`)
    } catch (error) {
      console.error('Error creating blog post:', error)
      toast.error('Failed to create blog post')
      setSaving(false)
    }
  }
  
  const handleBack = () => {
      router.push('/blog')
  }
  
  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <Skeleton className="h-[calc(100vh-200px)] w-full" />
      </div>
    )
  }
  
  return (
    <div className="py-6 space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Blog Post</h1>
            <p className="text-muted-foreground">
              Create a new blog post
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Post
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Write and format your blog post content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={handleTitleChange} 
                  placeholder="Enter blog post title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">/blog/</span>
                  <Input 
                    id="slug" 
                    value={slug} 
                    onChange={handleSlugChange} 
                    placeholder="enter-slug-here"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <MarkdownEditor
                  value={content}
                  onChange={handleContentChange}
                  height="min-h-[400px]"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
              <CardDescription>
                A short summary of your blog post that will be displayed in previews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={excerpt} 
                onChange={handleExcerptChange} 
                placeholder="Enter a brief excerpt (optional)"
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure blog post settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image</Label>
                <BlogImageUpload
                  value={coverImage}
                  onChange={handleCoverImageChange}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended size: 1200×675 pixels (16:9 ratio)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Categories</Label>
                <MultiSelect
                  options={availableCategories}
                  selected={selectedCategories}
                  onChange={handleCategoryChange}
                  placeholder="Select categories"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <MultiSelect
                  options={availableTags}
                  selected={selectedTags}
                  onChange={handleTagChange}
                  placeholder="Select tags"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="published">Published</Label>
                  <div className="text-sm text-muted-foreground">
                    {published ? (
                      <div className="flex items-center text-green-600">
                        <Eye className="h-3 w-3 mr-1" />
                        Visible to readers
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft mode
                      </div>
                    )}
                  </div>
                </div>
                <Switch 
                  id="published" 
                  checked={published} 
                  onCheckedChange={handlePublishedChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="featured">Featured</Label>
                  <div className="text-sm text-muted-foreground">
                    Show in featured section
                  </div>
                </div>
                <Switch 
                  id="featured" 
                  checked={featured} 
                  onCheckedChange={handleFeaturedChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 