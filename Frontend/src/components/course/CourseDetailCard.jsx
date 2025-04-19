import React from "react";
import { Link } from 'react-router-dom';
import { Clock, Calendar, Globe, TrendingUp, User as UserIcon, BookOpen } from "lucide-react";
import PlaceholderImage from '../../assets/svgs/placeholder-image.svg';
import Button from "../common/Button";
import { StarRatingDisplay } from './StarRating';

const MetaItem = ({ icon: Icon, label, value, children }) => (
    <div className="flex items-start gap-2" title={`${label}: ${value || children || 'N/A'}`}>
        <Icon size={16} className="text-primary/70 flex-shrink-0 mt-px" aria-hidden="true" />
        <div className="text-sm text-muted-foreground">
            {children || value || 'N/A'}
        </div>
    </div>
);


const CourseDetailCard = ({
    course,
    enrollButtonEnable,
    onEnrollClick,
    isEnrolling = false,
    isEnrolled = false,
    averageRating = null
}) => {

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (error) { return 'Invalid Date'; }
    };

    const formatDurationInMinutes = (totalSeconds) => {
        if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds) || totalSeconds < 0) {
            return 'N/A';
        }
        if (totalSeconds === 0) {
            return '0 min';
        }
        const totalMinutes = Math.ceil(totalSeconds / 60);
        return `${totalMinutes} min`;
    };

    const showActionButton = enrollButtonEnable || isEnrolled;

    const courseTitle = course?.course_title ?? "Course Title Unavailable";
    const courseDescription = course?.course_description ?? "No description provided.";
    const thumbnailUrl = course?.thumbnail_url;
    const categoryName = course?.category_name;
    const difficultyLevel = course?.difficulty_level ?? 'N/A';
    const language = course?.language ?? 'N/A';
    const creatorName = course?.creator_name ?? 'Unknown Instructor';
    const creatorId = course?.creator_id;
    const price = course?.price;
    const duration = formatDurationInMinutes(course?.estimated_duration_seconds);
    const createdDate = formatDate(course?.date_of_creation);
    const updatedDate = formatDate(course?.updated_date);
    const totalLessons = course?.total_lessons_count ?? 'N/A';

    return (
        <div className="card p-6 mb-6 flex flex-col md:flex-row items-start gap-6 md:gap-8 w-full shadow-md border border-border">

            <div className="flex-1 space-y-4 order-2 md:order-1">
                {categoryName && (
                    <div className="text-xs uppercase font-semibold tracking-wider text-primary">
                        {categoryName}
                    </div>
                )}

                <h1 className="text-2xl lg:text-3xl font-bold text-card-foreground">
                    {courseTitle}
                </h1>

                <div className="flex items-center gap-2">
                    {averageRating !== null && averageRating > 0 ? (
                        <>
                            <span className="text-sm font-medium text-yellow-500">{averageRating.toFixed(1)}</span>
                            <StarRatingDisplay rating={averageRating} size="sm" />
                        </>
                    ) : (
                        averageRating === 0 ? (
                            <span className="text-sm text-muted-foreground italic">No reviews yet</span>
                        ) : (
                            <span className="text-sm text-muted-foreground italic">Rating N/A</span>
                        )
                    )}
                </div>

                <p className="text-muted-foreground text-base line-clamp-4">
                    {courseDescription}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground pt-3 border-t border-border/50">
                    <MetaItem icon={UserIcon} label="Instructor">
                        {creatorId ? (
                            <Link to={`/author/${creatorId}`} className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                                {creatorName}
                            </Link>
                        ) : (
                            <span className="font-medium">{creatorName}</span>
                        )}
                    </MetaItem>

                    <MetaItem icon={Clock} label="Duration" value={duration} />

                    <MetaItem icon={BookOpen} label="Lessons" value={totalLessons.toString()} />

                    <MetaItem icon={TrendingUp} label="Level" value={difficultyLevel} />

                    <MetaItem icon={Globe} label="Language" value={language} />

                    <MetaItem icon={Calendar} label="Published" value={`${createdDate} (Creation)`} />
                    <MetaItem icon={Calendar} label="Updated" value={`${updatedDate} (Last Update)`} />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {!isEnrolled && (
                        <span className="text-2xl font-semibold text-foreground block">
                            {price !== undefined && price !== null
                                ? (parseFloat(price) === 0 ? "Free" : `₹${parseFloat(price).toFixed(2)}`)
                                : "Price N/A"}
                        </span>
                    )}
                    {showActionButton && (
                        <Button
                            variant={isEnrolled ? "secondary" : "primary"}
                            size="lg"
                            className="w-full sm:w-auto shadow-md"
                            onClick={!isEnrolled ? onEnrollClick : undefined}
                            disabled={isEnrolling || isEnrolled}
                            isLoading={isEnrolling}
                        >
                            {isEnrolled ? "Already Enrolled" : (price === 0 ? "Enroll for Free" : "Enroll Now")}
                        </Button>
                    )}
                </div>
            </div>

            {thumbnailUrl && (
                <div className="w-full md:w-1/3 lg:w-1/4 self-center md:self-start flex-shrink-0 mt-4 md:mt-0 order-1 md:order-2">
                    <img
                        src={thumbnailUrl || PlaceholderImage}
                        alt={courseTitle}
                        className="w-full aspect-video object-cover rounded-lg border border-border shadow-lg bg-muted"
                        onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderImage; }}
                        loading="lazy"
                    />
                </div>
            )}
        </div>
    );
};

export default CourseDetailCard;