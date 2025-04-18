// src/components/course/ReviewForm.jsx
// Updated to use correct image field name
import React, { useEffect, useState } from 'react';
import StarRating, { StarRatingDisplay } from './StarRating';
import { fetchMyReviewForCourse, addOrUpdateReview } from "../../services/api";
import LoadingSpinner from '../common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import Button from '../common/Button';

const ReviewForm = ({ userId, courseId }) => {
    const [existingReview, setExistingReview] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
    const [loadingReview, setLoadingReview] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const { success: showSuccessToast, error: showErrorToast } = useToast();

    useEffect(() => {
        const loadReview = async () => {
            if (!userId || !courseId) { setLoadingReview(false); return; }
            setLoadingReview(true); setFetchError(null); setExistingReview(null);
            try {
                const data = await fetchMyReviewForCourse(courseId);
                if (data.review) {
                    setExistingReview(data.review);
                    setReviewForm({ rating: data.review.rating, comment: data.review.comment || "" });
                } else {
                    setExistingReview(null); setReviewForm({ rating: 0, comment: "" });
                }
            } catch (err) {
                if (!err.message?.toLowerCase().includes('not found') && !err.message?.includes('404')) {
                    console.error("Error fetching existing review:", err);
                    setFetchError("Could not check for your existing review.");
                    showErrorToast("Could not check for your existing review.");
                }
                setExistingReview(null); setReviewForm({ rating: 0, comment: "" });
            } finally { setLoadingReview(false); }
        };
        loadReview();
    }, [courseId, userId, showErrorToast]); // Added showErrorToast dependency

    const handleRatingChange = (newRating) => {
        setReviewForm((prev) => ({ ...prev, rating: newRating }));
    };

    const handleCommentChange = (e) => {
        setReviewForm((prev) => ({ ...prev, comment: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (reviewForm.rating === 0) { showErrorToast("Please select a star rating."); return; }
        setLoadingSubmit(true);
        try {
            const reviewData = { rating: reviewForm.rating, comment: reviewForm.comment.trim() };
            const response = await addOrUpdateReview(courseId, reviewData);
            showSuccessToast(existingReview ? "Review updated successfully!" : "Review submitted successfully!");
            setExistingReview(response.review); // Update local state with returned review
        } catch (error) {
            console.error("Submit/Update review error:", error);
            showErrorToast(error.message || "Failed to submit review.");
        } finally { setLoadingSubmit(false); }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try { return new Date(dateString).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch (error) { return ''; }
    };

    return (
        <div className="w-full mt-8">
            <h3 className="text-xl font-semibold text-foreground mb-4">
                {existingReview ? "Your Review" : "Leave a Review"}
            </h3>
            {loadingReview && <div className="card p-6 flex justify-center items-center"><LoadingSpinner size="h-6 w-6" /></div>}
            {fetchError && !loadingReview && <p className="text-center text-destructive py-4">{fetchError}</p>}
            {!loadingReview && !fetchError && (
                <form onSubmit={handleSubmit} className="card p-5 md:p-6 space-y-5">
                    {existingReview && (
                        <div className="mb-4 border-b border-border pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <StarRatingDisplay rating={existingReview.rating} size="md" />
                                <span className='text-sm text-muted-foreground'>{formatDate(existingReview.review_date)}</span>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-wrap">{existingReview.comment || <i>No comment provided.</i>}</p>
                            <p className="text-xs text-primary mt-3">You can update your review below.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{existingReview ? "Update Your Rating *" : "Your Rating *"}</label>
                        <StarRating rating={reviewForm.rating} onChange={handleRatingChange} size="lg" />
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">{existingReview ? "Update Your Comment" : "Your Comment *"}</label>
                        <textarea id="comment" name="comment" value={reviewForm.comment} onChange={handleCommentChange} rows={4}
                            placeholder="Share your experience with the course..." className="textarea" disabled={loadingSubmit}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" size="md" isLoading={loadingSubmit} disabled={loadingSubmit}>
                            {existingReview ? "Update Review" : "Submit Review"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ReviewForm;