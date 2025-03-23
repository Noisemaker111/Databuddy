"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { getBlogPost, updateBlogPost, deleteBlogPost, getCategories, getTags } from '../../../../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { MultiSelect } from '@/components/ui/multi-select'
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { toast } from 'sonner'
import { Pencil, Save, Trash2, X, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { BlogImageUpload, ImageSize } from '@/components/blog-image-upload'

interface BlogPostData {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  published: boolean
  featured?: boolean
  author?: {
    id: string
    name: string | null
    image: string | null
  }
  category?: Array<{id: string, name: string}> | {id: string, name: string}
  tags?: Array<{id: string, name: string}> | {id: string, name: string}
  createdAt: Date
  updatedAt: Date
}

export default function EditBlogPost() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
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
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<any[]>([])
  const [availableTags, setAvailableTags] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch post, categories, and tags in parallel
        const [postData, categoriesData, tagsData] = await Promise.all([
          getBlogPost(id as string),
          getCategories(),
          getTags()
        ])
        
        if (!postData) {
          toast.error('Blog post not found')
          router.push('/admin/blog')
          return
        }
        
        // Type assertion to help TypeScript understand the structure
        const post = postData as unknown as BlogPostData
        
        // Set post data - ensure content preserves whitespace
        setTitle(post.title)
        setSlug(post.slug)
        setContent(post.content || '')
        setExcerpt(post.excerpt || '')
        setCoverImage(post.coverImage || '')
        setPublished(post.published)
        setFeatured(post.featured || false)
        
        // Safely set categories using optional chaining and type guards
        if (Array.isArray(post.category)) {
          setSelectedCategories(post.category.map(cat => cat.id))
        } else if (post.category?.id) {
          setSelectedCategories([post.category.id])
        } else {
          setSelectedCategories([])
        }
        
        // Safely set tags using optional chaining and type guards
        if (Array.isArray(post.tags)) {
          setSelectedTags(post.tags.map(tag => tag.id))
        } else if (post.tags?.id) {
          setSelectedTags([post.tags.id])
        } else {
          setSelectedTags([])
        }
        
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
        toast.error('Failed to load blog post')
        router.push('/admin/blog')
      }
    }
    
    fetchData()
  }, [id, router])
  
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
        categoryIds: selectedCategories,
        tagIds: selectedTags
      }
      
      // Add image sizes metadata if available
      if (allImageSizes) {
        postData.imageSizes = JSON.stringify(allImageSizes)
      }
      
      await updateBlogPost(id as string, postData)
      
      toast.success('Blog post saved successfully')
      setSaving(false)
    } catch (error) {
      console.error('Error saving blog post:', error)
      toast.error('Failed to save blog post')
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeleting(true)
      
      await deleteBlogPost(id as string)
      
      toast.success('Blog post deleted successfully')
      router.push('/admin/blog')
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast.error('Failed to delete blog post')
      setDeleting(false)
    }
  }
  
  const handleBack = () => {
    router.push('/admin/blog')
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
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
            <p className="text-muted-foreground">
              Make changes to your blog post
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDelete} 
            disabled={deleting || saving}
          >
            {deleting ? (
              <>Deleting...</>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                Delete
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={saving || deleting}
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
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
                  disabled={saving || deleting}
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
          
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your post will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Post
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 