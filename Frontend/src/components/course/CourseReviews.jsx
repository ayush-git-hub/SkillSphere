// src/components/course/CourseReviews.jsx
// Updated to use correct image field name
import React, { useState, useEffect } from 'react';
import { StarRatingDisplay } from './StarRating';
import LoadingSpinner from '../common/LoadingSpinner';
import { fetchReviewsForCourse } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { User as UserIcon } from 'lucide-react';

const CourseReviews = ({ courseId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { error: showErrorToast } = useToast();

    useEffect(() => {
        const loadReviews = async () => {
            if (!courseId) return;
            setLoading(true); setError(null);
            try {
                const data = await fetchReviewsForCourse(courseId);
                setReviews(data.reviews || []);
            } catch (err) {
                console.error(`Error fetching reviews for course ${courseId}:`, err);
                setError("Could not load reviews at this time.");
                if (!err.message?.includes('404') && !err.message?.toLowerCase().includes('not found')) {
                    showErrorToast(err.message || "Could not load reviews.");
                }
                setReviews([]);
            } finally { setLoading(false); }
        };
        loadReviews();
    }, [courseId, showErrorToast]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try { return new Date(dateString).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch (error) { return ''; }
    };

    return (
        <div className="w-full">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-foreground">Student Feedback</h2>
            <div className="space-y-4">
                {loading && <div className="flex justify-center items-center py-8"><LoadingSpinner size="h-8 w-8" /></div>}
                {error && !loading && <div className="text-center py-6 text-destructive bg-destructive/10 rounded-md"><p>{error}</p></div>}
                {!loading && !error && reviews.length === 0 && <div className="text-center py-6 text-muted-foreground bg-card border border-border rounded-md"><p>Be the first to review this course!</p></div>}
                {!loading && !error && reviews.length > 0 && (
                    reviews.map((review) => (
                        <div key={review.review_id} className="card p-4 flex gap-4">
                            <div className="mt-1">
                                {/* Use profile_image_original_url (thumbnail removed from backend) */}
                                <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-medium uppercase flex-shrink-0 overflow-hidden border border-border">
                                    {review.user_profile_image_original_url ? (
                                        <img
                                            src={review.user_profile_image_original_url}
                                            alt={review.user_name || "User"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = review.user_name?.charAt(0) || '<svg class="h-4 w-4"><use xlink:href="#user-icon"></use></svg>'; }} // Fallback within div
                                        />
                                    ) : (
                                        review.user_name?.charAt(0) || <UserIcon size={16} id="user-icon" /> // Fallback initial or icon
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-4 mb-1.5">
                                    <div>
                                        <p className="text-sm font-semibold text-card-foreground">{review.user_name || 'Anonymous'}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(review.review_date)}</p>
                                    </div>
                                    <StarRatingDisplay rating={review.rating} size="sm" />
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CourseReviews;