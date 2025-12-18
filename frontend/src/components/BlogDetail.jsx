import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import blogService from '../services/blogService';
import BottomNavbar from './BottomNavbar';
import Footer from './Footer';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';
import toast from 'react-hot-toast';

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogService.getBlogBySlug(slug);
      if (response.success && response.data.blog) {
        setBlog(response.data.blog);
        // Fetch related blogs
        fetchRelatedBlogs(response.data.blog.category, response.data.blog._id);
      } else {
        setError('Blog not found');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      setError(error.message || 'Failed to load blog');
      toast.error('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (category, currentBlogId) => {
    try {
      const response = await blogService.getPublishedBlogs();
      if (response.success) {
        const related = (response.data.blogs || [])
          .filter(b => b.category === category && (b._id || b.id) !== currentBlogId)
          .slice(0, 3);
        setRelatedBlogs(related);
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return heroimg;
    if (imgPath.startsWith('http')) return imgPath;
    return imgPath;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'News': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Tutorial': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Product Review': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Tips & Tricks': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Company News': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[category] || colors['Other'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
        <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 md:gap-3">
                {logo && (
                  <img
                    src={logo}
                    alt="Vintage Beauty Logo"
                    className="h-6 md:h-8 w-auto"
                  />
                )}
                <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                  Blog
                </h1>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-2xl">
          <div className="text-center">
            <div className="mb-6 md:mb-8">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Loading Blog...</h2>
            <p className="text-gray-400">Please wait while we fetch the blog post</p>
          </div>
        </div>
        <BottomNavbar />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
        <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 md:gap-3">
                {logo && (
                  <img
                    src={logo}
                    alt="Vintage Beauty Logo"
                    className="h-6 md:h-8 w-auto"
                  />
                )}
                <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                  Blog
                </h1>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-2xl">
          <div className="text-center">
            <svg className="w-16 h-16 md:w-24 md:h-24 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Blog Not Found</h3>
            <p className="text-gray-400 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/blogs')}
              className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg text-sm md:text-base transition-all duration-300 shadow-lg"
            >
              View All Blogs
            </button>
          </div>
        </div>
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* Header */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              {logo && (
                <img
                  src={logo}
                  alt="Vintage Beauty Logo"
                  className="h-6 md:h-8 w-auto"
                />
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                Blog
              </h1>
            </div>

            <button
              onClick={() => navigate('/blogs')}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              title="View All Blogs"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Blog Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
        {/* Featured Image */}
        {blog.featuredImage && (
          <div className="mb-6 md:mb-8 rounded-xl overflow-hidden">
            <img
              src={getImageUrl(blog.featuredImage)}
              alt={blog.title}
              className="w-full h-64 md:h-96 object-cover"
              onError={(e) => { e.target.src = heroimg; }}
            />
          </div>
        )}

        {/* Blog Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getCategoryColor(blog.category)}`}>
              {blog.category}
            </span>
            {blog.isFeatured && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
            {blog.title}
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8">
            {blog.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-gray-400 pb-4 md:pb-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{blog.author || 'Admin'}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(blog.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{blog.views || 0} views</span>
            </div>
          </div>
        </div>

        {/* Blog Content */}
        <div className="prose prose-invert prose-lg max-w-none mb-8 md:mb-12">
          <div className="text-gray-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {blog.content}
          </div>
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-gray-800">
            <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-800 text-gray-300 border border-gray-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-gray-800">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">Related Blogs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <div
                  key={relatedBlog._id || relatedBlog.id}
                  onClick={() => navigate(`/blog/${relatedBlog.slug}`)}
                  className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-800 hover:border-[#D4AF37]/30 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  <div className="relative h-40 bg-gray-800 overflow-hidden">
                    <img
                      src={getImageUrl(relatedBlog.featuredImage)}
                      alt={relatedBlog.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = heroimg; }}
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-base md:text-lg font-bold text-white mb-2 line-clamp-2">
                      {relatedBlog.title}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-400 mb-3 line-clamp-2">
                      {relatedBlog.excerpt}
                    </p>
                    <button className="text-[#D4AF37] text-sm font-medium hover:text-[#F4D03F] transition-colors">
                      Read More →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blogs Button */}
        <div className="mt-8 md:mt-12 text-center">
          <button
            onClick={() => navigate('/blogs')}
            className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg text-sm md:text-base transition-all duration-300 shadow-lg"
          >
            View All Blogs
          </button>
        </div>
      </div>

      <Footer />
      <BottomNavbar />
    </div>
  );
};

export default BlogDetail;

