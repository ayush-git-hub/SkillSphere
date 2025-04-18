// src/components/course/CourseCard.jsx
// Updated: Uses estimated_duration, correct image URL
import React from "react";
import { User, Clock, Globe, TrendingUp, Eye, BookOpen, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlaceholderImage from '../../assets/svgs/placeholder-image.svg';
import Button from "../common/Button";

const CourseCard = ({ course, navigationLink, isEnrolled = false, isCreatorView = false }) => {
    const navigate = useNavigate();

    const handleClick = (id) => {
        if (id && navigationLink) { // Ensure link exists
            navigate(`/${navigationLink}/${id}`);
        } else if (id) {
            console.warn("Navigation link missing for course card");
            navigate(`/explore/${id}`); // Fallback?
        }
    };

    // Format duration (assuming backend provides estimated_duration in minutes)
    const formatDuration = (totalMinutes) => {
        if (totalMinutes === undefined || totalMinutes === null || isNaN(totalMinutes) || totalMinutes <= 0) return 'N/A';
        const hrs = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60); // Use Math.round for better accuracy if seconds were included
        let result = '';
        if (hrs > 0) result += `${hrs}hr `;
        if (mins > 0) result += `${mins}min`;
        return result.trim() || '0min'; // Handle case where duration might be 0
    };


    const id = course?.course_id;
    const title = course?.course_title ?? "Untitled Course";
    const thumbnailUrl = course?.thumbnail_url; // Use the direct URL from backend (correct folder)
    const creatorName = course?.creator_name ?? "Unknown Instructor";
    const difficulty = course?.difficulty_level ?? "N/A";
    const language = course?.language ?? "N/A";
    const price = course?.price;
    // Use estimated_duration from backend (assuming minutes)
    const duration = formatDuration(course?.estimated_duration);

    // Action Button Logic (remains mostly the same)
    let actionButton;
    if (isEnrolled) {
        actionButton = (
            <Button variant="secondary" size="sm" className="w-full mt-2 text-xs" onClick={(e) => { e.stopPropagation(); handleClick(id); }}>
                <BookOpen size={14} className="mr-1" /> Continue Learning
            </Button>
        );
    } else if (isCreatorView) {
        actionButton = (
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={(e) => { e.stopPropagation(); handleClick(id); }}>
                <Edit size={14} className="mr-1" /> Manage Course
            </Button>
        );
    } else { // Explore view
        actionButton = (
            <Button variant="primary" size="sm" className="w-full mt-2 text-xs" onClick={(e) => { e.stopPropagation(); handleClick(id); }}>
                {price !== undefined && price !== null ? (parseFloat(price) === 0 ? "View Details" : `Enroll for ₹${parseFloat(price).toFixed(2)}`) : <><Eye size={14} className="mr-1" /> View Details</>}
            </Button>
        );
    }

    return (
        <div
            className="card flex flex-col h-full overflow-hidden group cursor-pointer transform transition duration-300 ease-in-out hover:shadow-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background rounded-lg"
            onClick={() => handleClick(id)}
            role="link" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(id)}
            aria-label={`View course: ${title}`}
        >
            <div className="relative aspect-video overflow-hidden border-b border-border">
                <img
                    src={thumbnailUrl || PlaceholderImage} // Use direct URL
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 bg-muted"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderImage; }}
                />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-base md:text-lg text-card-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3" title={`Instructor: ${creatorName}`}>
                    <User className="size-3.5 flex-shrink-0" />
                    <span className="truncate">{creatorName}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground mt-auto pt-2">
                    {duration !== 'N/A' && <MetaItem icon={Clock} value={duration} title="Duration" />}
                    <MetaItem icon={TrendingUp} value={difficulty} title="Difficulty" />
                    <MetaItem icon={Globe} value={language} title="Language" />
                    {/* Removed rating/updated date from card for brevity, keep in detail view */}
                </div>
                <div className="pt-3 mt-1">
                    {actionButton}
                </div>
            </div>
        </div>
    );
};

const MetaItem = ({ icon: Icon, value, title }) => (
    <div className="flex items-center gap-1 overflow-hidden" title={title ? `${title}: ${value}` : value}>
        <Icon className="size-3.5 flex-shrink-0" aria-hidden="true" />
        <span className="truncate">{value}</span>
    </div>
);

export default CourseCard;