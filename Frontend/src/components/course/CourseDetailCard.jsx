// src/components/course/CourseDetailCard.jsx
// Updated: Displays rating (passed as prop), uses updated_date
import React from "react";
import { Clock, Calendar, Globe, TrendingUp, User as UserIcon } from "lucide-react";
import PlaceholderImage from '../../assets/svgs/placeholder-image.svg';
import Button from "../common/Button";
import { StarRatingDisplay } from './StarRating'; // Import display rating

const CourseDetailCard = ({
    course,
    enrollButtonEnable,
    onEnrollClick,
    isEnrolling = false,
    isEnrolled = false,
    averageRating = null // Receive average rating as prop
}) => {

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (error) { return 'Invalid Date'; }
    };

    const formatDuration = (totalMinutes) => {
        if (totalMinutes === undefined || totalMinutes === null || isNaN(totalMinutes) || totalMinutes <= 0) return 'N/A';
        const hrs = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60);
        let result = '';
        if (hrs > 0) result += `${hrs}hr `;
        if (mins > 0) result += `${mins}min`;
        return result.trim() || '0min';
    };

    const showActionButton = enrollButtonEnable || isEnrolled;

    return (
        <div className="card p-6 mb-6 flex flex-col md:flex-row items-start gap-6 md:gap-8 w-full">
            {/* Text Content */}
            <div className="flex-1 space-y-4">
                {course?.category_name && (
                    <div className="text-xs uppercase font-semibold tracking-wider text-primary/80">
                        {course.category_name}
                    </div>
                )}

                <h1 className="text-3xl font-bold text-card-foreground">
                    {course?.course_title ?? "Course Title Unavailable"}
                </h1>

                {/* Display Rating if available */}
                {averageRating !== null && averageRating > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-yellow-500">{averageRating.toFixed(1)}</span>
                        <StarRatingDisplay rating={averageRating} size="sm" />
                        {/* Optional: Display number of reviews */}
                        {/* <span className="text-sm text-muted-foreground">(based on X reviews)</span> */}
                    </div>
                )}
                {averageRating === 0 && (
                    <span className="text-sm text-muted-foreground italic">No reviews yet</span>
                )}

                <p className="text-muted-foreground text-base line-clamp-4">
                    {course?.course_description ?? "No description provided."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground pt-2">
                    <MetaItem icon={Clock} label="Duration" value={formatDuration(course?.estimated_duration)} />
                    {/* Use updated_date from backend */}
                    <MetaItem icon={Calendar} label="Last Updated" value={formatDate(course?.updated_date)} />
                    <MetaItem icon={TrendingUp} label="Level" value={course?.difficulty_level ?? 'N/A'} />
                    <MetaItem icon={Globe} label="Language" value={course?.language ?? 'N/A'} />
                    <MetaItem icon={UserIcon} label="Instructor" value={course?.creator_name ?? 'Unknown'} />
                    {/* Optionally show Created Date too */}
                    <MetaItem icon={Calendar} label="Created" value={formatDate(course?.date_of_creation)} />
                </div>

                {/* Price and Action Button */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {!isEnrolled && (
                        <span className="text-2xl font-semibold text-foreground block">
                            {course?.price !== undefined && course?.price !== null
                                ? (parseFloat(course.price) === 0 ? "Free" : `₹${parseFloat(course.price).toFixed(2)}`)
                                : "Price not set"}
                        </span>
                    )}
                    {showActionButton && (
                        <Button
                            variant={isEnrolled ? "secondary" : "primary"}
                            size="md"
                            className="w-full sm:w-auto"
                            onClick={!isEnrolled ? onEnrollClick : undefined}
                            disabled={isEnrolling || (isEnrolled)}
                            isLoading={isEnrolling}
                        >
                            {isEnrolled ? "Already Enrolled" : "Enroll Now"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Thumbnail Image */}
            {course?.thumbnail_url && (
                <div className="w-full md:w-1/3 lg:w-1/4 self-center md:self-start flex-shrink-0 mt-4 md:mt-0">
                    <img
                        src={course.thumbnail_url || PlaceholderImage} // Use backend URL
                        alt={course.course_title ?? "Course thumbnail"}
                        className="w-full aspect-video object-cover rounded-lg border border-border shadow-md bg-muted"
                        onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderImage; }}
                        loading="lazy"
                    />
                </div>
            )}
        </div>
    );
};

// Helper sub-component
const MetaItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2" title={`${label}: ${value}`}>
        <Icon size={16} className="text-primary/70 flex-shrink-0" />
        <span className="truncate">{value}</span>
    </div>
);

export default CourseDetailCard;