import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { products, reviews } from '../api';
import toast from 'react-hot-toast';
import { pageVariants } from '../utils/pageAnimations';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';

const Reviews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [userReview, setUserReview] = useState(null);
  const [editingReview, setEditingReview] = useState(false);

  // Get product image - use product.images[0] or product.image if available, otherwise fallback
  const productImage = product?.images?.[0] || product?.image || heroimg;

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setProductLoading(true);
        const result = await products.getById(id);
        if (result.success && result.data) {
          setProduct(result.data);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setProductLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Fetch reviews and user review
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Fetch product reviews
        try {
          const reviewsResult = await reviews.getProductReviews(id);
          if (reviewsResult.success) {
            setReviews(reviewsResult.data || []);
          }
        } catch (apiError) {
          console.log('No reviews found:', apiError);
          setReviews([]);
        }

        // Fetch user's review if authenticated
        if (isAuthenticated && user) {
          try {
            const userReviewResult = await reviews.getUserReview(id);
            if (userReviewResult.success && userReviewResult.data) {
              setUserReview(userReviewResult.data);
              setReviewForm({
                rating: userReviewResult.data.rating,
                comment: userReviewResult.data.comment || ''
              });
            }
          } catch (error) {
            // User review not found or unauthorized - this is expected
            setUserReview(null);
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id, isAuthenticated, user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      navigate('/login', { state: { from: `/product/${id}/reviews` } });
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    try {
      setSubmitting(true);
      
      if (userReview && editingReview) {
        // Update existing review
        const result = await reviews.update(userReview._id, reviewForm.rating, reviewForm.comment);
        
        if (result.success) {
          toast.success(result.message || 'Review updated successfully');
          setUserReview(result.data);
          setEditingReview(false);
          setShowReviewForm(false);
          // Refresh reviews
          const reviewsResult = await reviews.getProductReviews(id);
          if (reviewsResult.success) {
            setReviews(reviewsResult.data || []);
          }
        }
      } else {
        // Create new review
        const result = await reviews.create(id, reviewForm.rating, reviewForm.comment);
        
        if (result.success) {
          toast.success(result.message || 'Review submitted successfully');
          setUserReview(result.data);
          setShowReviewForm(false);
          setReviewForm({ rating: 5, comment: '' });
          // Refresh reviews
          const reviewsResult = await reviews.getProductReviews(id);
          if (reviewsResult.success) {
            setReviews(reviewsResult.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      const result = await reviews.delete(userReview._id);
      if (result.success) {
        toast.success(result.message || 'Review deleted successfully');
        setUserReview(null);
        setReviewForm({ rating: 5, comment: '' });
        // Refresh reviews
        const reviewsResult = await reviews.getProductReviews(id);
        if (reviewsResult.success) {
          setReviews(reviewsResult.data || []);
        }
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.message || 'Failed to delete review');
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`${size} ${i < Math.floor(rating) ? 'text-[#D4AF37]' : 'text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <motion.div
      className="min-h-screen bg-black text-white overflow-x-hidden pb-24 md:pb-0"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Navigation Bar */}
      <motion.nav
        className="w-full bg-black border-b border-gray-800 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              {logo && (
                <img
                  src={logo}
                  alt="VINTAGE BEAUTY Logo"
                  className="h-6 md:h-8 w-auto"
                />
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                Reviews
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Product Info */}
        {productLoading ? (
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-800 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : product && (
          <div className="mb-6 md:mb-8">
            <Link
              to={`/product/${product._id || product.id}`}
              className="flex items-center gap-4 mb-4 hover:opacity-80 transition-opacity"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-800">
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white mb-1">{product.name}</h2>
                <p className="text-sm text-gray-400">{product.categoryName || product.category?.name || product.category}</p>
              </div>
            </Link>
          </div>
        )}

        {/* Rating Summary */}
        <div className="bg-[#3A2E1F] md:bg-[#4A3A2A] rounded-2xl p-6 md:p-8 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center">
                  {renderStars(parseFloat(calculateAverageRating()), 'w-6 h-6 md:w-8 md:h-8')}
                </div>
                <span className="text-2xl md:text-3xl font-bold text-white">
                  {calculateAverageRating()}
                </span>
                <span className="text-gray-400">out of 5</span>
              </div>
              <p className="text-sm md:text-base text-gray-300">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => {
                  if (userReview) {
                    setEditingReview(true);
                  }
                  setShowReviewForm(!showReviewForm);
                }}
                className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 py-3 rounded-lg transition-all duration-300"
              >
                {userReview ? 'Edit Your Review' : 'Write a Review'}
              </button>
            )}
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/login', { state: { from: `/product/${id}/reviews` } })}
                className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 py-3 rounded-lg transition-all duration-300"
              >
                Login to Review
              </button>
            )}
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#3A2E1F] md:bg-[#4A3A2A] rounded-2xl p-6 md:p-8 mb-6 md:mb-8"
          >
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              {editingReview ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${
                          star <= reviewForm.rating ? 'text-[#D4AF37]' : 'text-gray-600'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your experience with this product..."
                  className="w-full bg-black bg-opacity-30 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] resize-none"
                  rows="5"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setEditingReview(false);
                    if (userReview) {
                      setReviewForm({
                        rating: userReview.rating,
                        comment: userReview.comment || ''
                      });
                    } else {
                      setReviewForm({ rating: 5, comment: '' });
                    }
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
                {userReview && editingReview && (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}

        {/* Reviews List */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
            Customer Reviews ({reviews.length})
          </h3>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
              <p className="mt-4 text-gray-400">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-[#3A2E1F] md:bg-[#4A3A2A] rounded-2xl p-8 md:p-12 text-center">
              <svg
                className="w-16 h-16 md:w-20 md:h-20 text-gray-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400 text-lg mb-2">No reviews yet</p>
              <p className="text-gray-500 text-sm">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#3A2E1F] md:bg-[#4A3A2A] rounded-xl p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-400">
                          {review.user?.name || review.userName || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {userReview && userReview._id === review._id && (
                      <button
                        onClick={() => {
                          setEditingReview(true);
                          setShowReviewForm(true);
                        }}
                        className="text-[#D4AF37] hover:text-[#F4D03F] text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Reviews;

