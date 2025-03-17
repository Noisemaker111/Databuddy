"use server";

import { db } from "@databuddy/db";
import { unstable_cache } from "next/cache";
import { BlogPost, BlogCategory, BlogTag, transformPost, transformCategory, transformTag } from "@/app/lib/blog-types";

// Get all published blog posts
export const getAllPublishedPosts = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const posts = await db.post.findMany({
      where: { 
        published: true 
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the data using our utility function
    return posts.map(transformPost);
  },
  ["published-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get a single blog post by slug
export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    const post = await db.post.findUnique({
      where: { 
        slug,
        published: true
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: true,
        tags: true
      }
    });
    
    if (!post) return null;
    
    // Transform the data using our utility function
    return transformPost(post);
  },
  ["post-by-slug"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get posts by tag
export const getPostsByTag = unstable_cache(
  async (tagId: string): Promise<BlogPost[]> => {
    const posts = await db.post.findMany({
      where: {
        published: true,
        tags: {
          some: {
            id: tagId
          }
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the data using our utility function
    return posts.map(transformPost);
  },
  ["posts-by-tag"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get posts by category
export const getPostsByCategory = unstable_cache(
  async (categoryId: string): Promise<BlogPost[]> => {
    const posts = await db.post.findMany({
      where: {
        published: true,
        categoryId: categoryId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the data using our utility function
    return posts.map(transformPost);
  },
  ["posts-by-category"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get related posts based on categories and tags
export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryIds: string[], tagIds: string[], limit = 3): Promise<BlogPost[]> => {
    const posts = await db.post.findMany({
      where: {
        id: { not: postId },
        published: true,
        OR: [
          { categoryId: { in: categoryIds } },
          { tags: { some: { id: { in: tagIds } } } }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Transform the data using our utility function
    return posts.map(transformPost);
  },
  ["related-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get recent posts
export const getRecentPosts = unstable_cache(
  async (limit = 5): Promise<BlogPost[]> => {
    const posts = await db.post.findMany({
      where: { 
        published: true 
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Transform the data using our utility function
    return posts.map(transformPost);
  },
  ["recent-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all categories with post count
export const getAllCategories = unstable_cache(
  async (): Promise<BlogCategory[]> => {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories.map(transformCategory);
  },
  ["all-categories"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all tags with post count
export const getAllTags = unstable_cache(
  async (): Promise<BlogTag[]> => {
    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return tags.map(transformTag);
  },
  ["all-tags"],
  { revalidate: 3600 } // Revalidate every hour
); 