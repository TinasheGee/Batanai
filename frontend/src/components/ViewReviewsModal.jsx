import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ViewReviewsModal({
  isOpen,
  onClose,
  productId = null,
  businessId = null,
  productName = '',
  businessName = '',
}) {
  const [reviews, setReviews] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [secondedReviews, setSecondedReviews] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      const initModal = async () => {
        await fetchUserInfo();
        await fetchReviews();
      };
      initModal();
    }
  }, [isOpen, productId, businessId]);

  const fetchUserInfo = async () => {
    try {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        setUserId(payload.id);
        return payload.id; // Return the userId for immediate use
      }
    } catch (err) {
      console.error('Failed to decode token:', err);
    }
    return null;
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = productId
        ? `/reviews/product/${productId}`
        : `/reviews/business/${businessId}`;

      const response = await api.get(endpoint);
      const reviewsData = response.data;

      setReviews(reviewsData);

      // Fetch replies for each review
      reviewsData.forEach((review) => {
        fetchReplies(review.id);
      });

      // Get current user ID from token
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      let currentUserId = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentUserId = payload.id;
        } catch (err) {
          console.error('Failed to decode token:', err);
        }
      }

      // Check which reviews current user has seconded
      if (currentUserId) {
        const secondedIds = new Set();
        for (const review of reviewsData) {
          try {
            const res = await api.get(`/reviews/${review.id}/check-second`);
            if (res.data.hasSeconded) {
              secondedIds.add(review.id);
            }
          } catch (err) {
            // Ignore errors (user might not be authenticated)
          }
        }
        setSecondedReviews(secondedIds);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (reviewId) => {
    try {
      const response = await api.get(`/reviews/${reviewId}/replies`);
      setReplies((prev) => ({ ...prev, [reviewId]: response.data }));
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSecondReview = async (reviewId, reviewUserId) => {
    // Only customers can second reviews
    if (userRole !== 'customer') {
      toast.error('Only customers can second reviews');
      return;
    }

    // Cannot second your own review
    if (userId === reviewUserId) {
      toast.error('You cannot second your own review');
      return;
    }

    try {
      const response = await api.post(`/reviews/${reviewId}/second`);

      // Update the review's seconds count locally
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { ...review, seconds_count: response.data.seconds_count }
            : review
        )
      );

      // Add to seconded set
      setSecondedReviews((prev) => new Set([...prev, reviewId]));

      toast.success('Review seconded!', { position: 'top-right' });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to second review';
      toast.error(errorMsg, { position: 'top-right' });
    }
  };

  const handleUnsecondReview = async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}/second`);

      // Update the review's seconds count locally
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { ...review, seconds_count: response.data.seconds_count }
            : review
        )
      );

      // Remove from seconded set
      setSecondedReviews((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });

      toast.success('Review unsconded', { position: 'top-right' });
    } catch (error) {
      toast.error('Failed to unsecond review', { position: 'top-right' });
    }
  };

  if (!isOpen) return null;

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className="w-4 h-4"
            fill={star <= rating ? '#FCD34D' : '#E5E7EB'}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
              <p className="text-gray-600 mt-1">
                {productId && productName && `Reviews for ${productName}`}
                {businessId && businessName && `Reviews for ${businessName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                >
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {review.full_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Second Button (Only for customers) */}
                    {userRole === 'customer' && userId !== review.user_id && (
                      <button
                        onClick={() =>
                          secondedReviews.has(review.id)
                            ? handleUnsecondReview(review.id)
                            : handleSecondReview(review.id, review.user_id)
                        }
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          secondedReviews.has(review.id)
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={
                            secondedReviews.has(review.id)
                              ? 'currentColor'
                              : 'none'
                          }
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                          />
                        </svg>
                        <span>{review.seconds_count || 0}</span>
                      </button>
                    )}
                  </div>

                  {/* Review Comment */}
                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  {/* Business Replies */}
                  {replies[review.id] && replies[review.id].length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                      {replies[review.id].map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-blue-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm text-blue-600">
                                  {reply.business_name}
                                </p>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Business
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">
                                {reply.reply_text}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(reply.created_at).toLocaleDateString(
                                  'en-US',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
