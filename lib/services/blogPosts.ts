import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// --- BlogPost Interface (Clean - NO success/data fields) ---
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  body?: string;
  bodyOverview?: string;
  thumbnailImageUrl?: string;
  featuredImageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string | null;
  
  isPublished: boolean;
  isDeleted?: boolean; // ✅ Added for soft delete tracking
  publishedAt?: string;
  startDate?: string;
  endDate?: string;
  
  viewCount: number;
  commentCount?: number; // ✅ Added for comment count
  allowComments?: boolean;
  displayOrder?: number;
  showOnHomePage?: boolean;
  includeInSitemap?: boolean;
  limitedToStores?: boolean;
  
  blogCategoryId?: string | null;
  categoryIds?: string[]; // ✅ Added for multi-category
  categories?: any[]; // ✅ Added for detailed category info
  blogCategoryName?: string;
  
  authorId?: string | null;
  authorName?: string;
  
  tags?: string[];
  labels?: any[];
  comments?: Comment[]; // ✅ Added for comment data
  
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  searchEngineFriendlyPageName?: string;
  
  storeIds?: string[];
  relatedBlogPostIds?: string[];
  customerRoles?: string | null;
  languageId?: string;
  
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ✅ NEW: Comment Interface
export interface Comment {
  id: string;
  commentText: string;
  authorName?: string;
  authorEmail?: string;
  userId?: string;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  isSpam: boolean;
  spamScore?: number;
  flaggedAt?: string;
  parentCommentId?: string | null;
  replies?: Comment[];
  blogPostId: string;
  blogPostTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- BlogCategory Interface (Clean) ---
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// --- Generic ApiResponse ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}

// --- Stats Interface ---
export interface BlogPostStats {
  totalPosts: number;
  published: number;
  drafts: number;
  featured: number;
  totalComments?: number; // ✅ Added
  approvedComments?: number; // ✅ Added
  pendingComments?: number; // ✅ Added
  spamComments?: number; // ✅ Added
  deleted?: number; // ✅ Added
}

// --- Main Service ---
export const blogPostsService = {
  /**
   * Get all blog posts
   * @param includeUnpublished - Include unpublished posts
   * @param onlyHomePage - Filter only homepage posts
   * @param includeDeleted - Include deleted posts (soft delete)
   * @param config - Additional axios config
   */
  getAll: (
    includeUnpublished: boolean = true,
    onlyHomePage: boolean = false,
    includeDeleted: boolean = false,
    config: any = {}
  ) => {
    const params: any = {};
    
    if (includeUnpublished) {
      params.includeUnpublished = true;
    }
    
    if (onlyHomePage) {
      params.showOnHomePage = true;
    }
    
    if (includeDeleted) {
      params.includeDeleted = true;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${API_ENDPOINTS.blogPosts}${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ApiResponse<BlogPost[]>>(url, config);
  },

  /**
   * Get blog post by ID
   * @param id - Blog post ID
   * @param config - Additional axios config
   */
  getById: (id: string, config: any = {}) =>
    apiClient.get<ApiResponse<BlogPost>>(`${API_ENDPOINTS.blogPosts}/${id}`, config),

  /**
   * Get blog post by slug
   * @param slug - Blog post slug
   * @param config - Additional axios config
   */
  getBySlug: (slug: string, config: any = {}) =>
    apiClient.get<ApiResponse<BlogPost>>(`${API_ENDPOINTS.blogPosts}/slug/${slug}`, config),

  /**
   * Create new blog post
   * @param data - Blog post data
   * @param config - Additional axios config
   */
  create: (data: Partial<BlogPost>, config: any = {}) =>
    apiClient.post<ApiResponse<BlogPost>>(API_ENDPOINTS.blogPosts, data, config),

  /**
   * Update blog post by ID
   * @param id - Blog post ID
   * @param data - Updated blog post data
   * @param config - Additional axios config
   */
  update: (id: string, data: Partial<BlogPost>, config: any = {}) =>
    apiClient.put<ApiResponse<BlogPost>>(`${API_ENDPOINTS.blogPosts}/${id}`, data, config),

  /**
   * Delete blog post by ID (soft delete)
   * @param id - Blog post ID
   */
  delete: (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(`${API_ENDPOINTS.blogPosts}/${id}`),

  /**
   * ✅ NEW: Restore deleted blog post
   * @param id - Blog post ID
   */
  restore: (id: string) =>
    apiClient.post<ApiResponse<boolean>>(`${API_ENDPOINTS.blogPosts}/${id}/undelete`),

  /**
   * Upload blog post image
   * @param file - Image file
   * @param params - Additional query parameters
   */
  uploadImage: async (file: File, params?: Record<string, any>) => {
    const formData = new FormData();
    formData.append("image", file);
    const searchParams = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiClient.post<{ 
      success: boolean; 
      message: string; 
      data: string; 
      errors: string[] | null 
    }>(
      API_ENDPOINTS.uploadBlogPostImage + searchParams,
      formData
    );
  },

  /**
   * Delete blog post image
   * @param imageUrl - Image URL to delete
   */
  deleteImage: (imageUrl: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.deleteBlogPostImage, { 
      params: { imageUrl } 
    }),

  /**
   * Get all blog categories
   * @param config - Additional axios config
   */
  getAllCategories: (config: any = {}) =>
    apiClient.get<ApiResponse<BlogCategory[]>>('/api/BlogCategories', config),

  /**
   * ✅ NEW: Get blog post statistics
   * Calculate stats from posts data
   */
  getStats: async (): Promise<BlogPostStats> => {
    try {
      const response = await blogPostsService.getAll(true, false, true);
      const posts = response.data?.data || [];
      
      const totalPosts = posts.filter(p => !p.isDeleted).length;
      const published = posts.filter(p => p.isPublished && !p.isDeleted).length;
      const drafts = posts.filter(p => !p.isPublished && !p.isDeleted).length;
      const featured = posts.filter(p => p.showOnHomePage && !p.isDeleted).length;
      const deleted = posts.filter(p => p.isDeleted).length;

      // Calculate comment stats
      let totalComments = 0;
      let approvedComments = 0;
      let pendingComments = 0;
      let spamComments = 0;

      const getAllComments = (comments: Comment[]): Comment[] => {
        let allComments: Comment[] = [];
        comments.forEach(comment => {
          allComments.push(comment);
          if (comment.replies && Array.isArray(comment.replies)) {
            allComments = allComments.concat(getAllComments(comment.replies));
          }
        });
        return allComments;
      };

      posts.forEach(post => {
        if (post.comments && Array.isArray(post.comments)) {
          const allComments = getAllComments(post.comments);
          totalComments += allComments.length;
          approvedComments += allComments.filter(c => c.isApproved).length;
          pendingComments += allComments.filter(c => !c.isApproved && !c.isSpam).length;
          spamComments += allComments.filter(c => c.isSpam).length;
        }
      });

      return {
        totalPosts,
        published,
        drafts,
        featured,
        totalComments,
        approvedComments,
        pendingComments,
        spamComments,
        deleted
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalPosts: 0,
        published: 0,
        drafts: 0,
        featured: 0,
        totalComments: 0,
        approvedComments: 0,
        pendingComments: 0,
        spamComments: 0,
        deleted: 0
      };
    }
  },

  /**
   * ✅ NEW: Get comment count for a blog post
   * @param post - Blog post object
   */
  getCommentCount: (post: BlogPost): number => {
    if (!post.comments || !Array.isArray(post.comments)) return 0;
    
    const getAllComments = (comments: Comment[]): Comment[] => {
      let allComments: Comment[] = [];
      comments.forEach(comment => {
        allComments.push(comment);
        if (comment.replies && Array.isArray(comment.replies)) {
          allComments = allComments.concat(getAllComments(comment.replies));
        }
      });
      return allComments;
    };
    
    return getAllComments(post.comments).length;
  },

  /**
   * ✅ NEW: Get spam comment count for a blog post
   * @param post - Blog post object
   */
  getSpamCount: (post: BlogPost): number => {
    if (!post.comments || !Array.isArray(post.comments)) return 0;
    
    const getAllComments = (comments: Comment[]): Comment[] => {
      let allComments: Comment[] = [];
      comments.forEach(comment => {
        allComments.push(comment);
        if (comment.replies && Array.isArray(comment.replies)) {
          allComments = allComments.concat(getAllComments(comment.replies));
        }
      });
      return allComments;
    };
    
    return getAllComments(post.comments).filter(c => c.isSpam).length;
  },

  /**
   * ✅ NEW: Get approved comment count for a blog post
   * @param post - Blog post object
   */
  getApprovedCount: (post: BlogPost): number => {
    if (!post.comments || !Array.isArray(post.comments)) return 0;
    
    const getAllComments = (comments: Comment[]): Comment[] => {
      let allComments: Comment[] = [];
      comments.forEach(comment => {
        allComments.push(comment);
        if (comment.replies && Array.isArray(comment.replies)) {
          allComments = allComments.concat(getAllComments(comment.replies));
        }
      });
      return allComments;
    };
    
    return getAllComments(post.comments).filter(c => c.isApproved).length;
  },

  /**
   * ✅ NEW: Get pending comment count for a blog post
   * @param post - Blog post object
   */
  getPendingCount: (post: BlogPost): number => {
    if (!post.comments || !Array.isArray(post.comments)) return 0;
    
    const getAllComments = (comments: Comment[]): Comment[] => {
      let allComments: Comment[] = [];
      comments.forEach(comment => {
        allComments.push(comment);
        if (comment.replies && Array.isArray(comment.replies)) {
          allComments = allComments.concat(getAllComments(comment.replies));
        }
      });
      return allComments;
    };
    
    return getAllComments(post.comments).filter(c => !c.isApproved && !c.isSpam).length;
  },
};

// ✅ Export helper functions for use in components
export const blogPostHelpers = {
  /**
   * Get all comments including nested replies
   */
  getAllComments: (comments: Comment[]): Comment[] => {
    let allComments: Comment[] = [];
    comments.forEach(comment => {
      allComments.push(comment);
      if (comment.replies && Array.isArray(comment.replies)) {
        allComments = allComments.concat(blogPostHelpers.getAllComments(comment.replies));
      }
    });
    return allComments;
  },

  /**
   * Format date string
   */
  formatDate: (dateString?: string): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  },

  /**
   * Format date and time string
   */
  formatDateTime: (dateString?: string): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  },

  /**
   * Truncate text to specified length
   */
  truncateText: (text: string, maxLength: number = 100): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },


  /**
   * Strip HTML tags from text
   */
  stripHtml: (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  },

  /**
   * Get reading time estimate (words per minute)
   */
  getReadingTime: (text: string, wpm: number = 200): number => {
    if (!text) return 0;
    const words = blogPostHelpers.stripHtml(text).split(/\s+/).length;
    return Math.ceil(words / wpm);
  },
};

export default blogPostsService;
