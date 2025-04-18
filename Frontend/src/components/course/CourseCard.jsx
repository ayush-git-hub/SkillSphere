import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Clock, Globe, TrendingUp, BookOpen, Edit, CalendarCheck2, CalendarClock, Star } from "lucide-react"; // Added Star
import PlaceholderImage from '../../assets/svgs/placeholder-image.svg';
import Button from "../common/Button";

const MetaItem = ({ icon: Icon, value, title }) => (
    <div className="flex items-center gap-1.5 overflow-hidden" title={title ? `${title}: ${value}` : value}>
        <Icon className="size-3.5 flex-shrink-0 text-muted-foreground/80" aria-hidden="true" />
        <span className="truncate text-foreground">{value}</span>
    </div>
);

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
    const totalMinutes = Math.ceil(totalSeconds / 60);
    return `${totalMinutes} min`;
};


const CourseCard = ({
    course,
    viewType = 'explore' // 'explore', 'enrolled', 'created'
}) => {
    const navigate = useNavigate();

    const id = course?.course_id;
    const title = course?.course_title ?? "Untitled Course";
    const thumbnailUrl = course?.thumbnail_url;
    const creatorName = course?.creator_name ?? "Unknown Instructor"; // See explanation below
    const difficulty = course?.difficulty_level ?? "N/A";
    const language = course?.language ?? "N/A";
    const price = course?.price;
    const duration = formatDurationInMinutes(course?.estimated_duration_seconds);
    const lessonCount = course?.total_lessons_count ?? 0;
    const creationDate = formatDate(course?.date_of_creation);
    const updateDate = formatDate(course?.updated_date);
    const averageRating = course?.average_rating;

    let buttonText = "View Details";
    let buttonVariant = "primary";
    let buttonIcon = null;
    let buttonAction = () => { if (id) navigate(`/explore/${id}`) };

    switch (viewType) {
        case 'enrolled':
            buttonText = "Continue Learning"; buttonVariant = "secondary"; buttonIcon = BookOpen;
            buttonAction = () => { if (id) navigate(`/enrolled-course/${id}`) };
            break;
        case 'created':
            buttonText = "Manage Course"; buttonVariant = "outline"; buttonIcon = Edit;
            buttonAction = () => { if (id) navigate(`/created-course/${id}`) };
            break;
        case 'explore': default:
            if (price === 0) { buttonText = "View Details"; }
            else if (price > 0) { buttonText = "Explore Course"; }
            buttonAction = () => { if (id) navigate(`/explore/${id}`) };
            break;
    }

    let priceDisplay = null;
    priceDisplay = price === 0 ? "Free" : (price > 0 ? `₹${parseFloat(price).toFixed(2)}` : "Price N/A");

    return (
        <div className="card flex flex-col h-full overflow-hidden border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="relative aspect-video overflow-hidden border-b border-border">
                <img
                    src={thumbnailUrl || PlaceholderImage}
                    alt={title}
                    className="w-full h-full object-cover bg-muted" // No scaling on hover
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderImage; }}
                />
                {averageRating !== undefined && averageRating !== null && averageRating > 0 && (
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-border/50 flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-semibold text-foreground">{averageRating.toFixed(1)}</span>
                    </div>
                )}
                {priceDisplay && (
                    <span className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md border border-border/50 shadow-sm">
                        {priceDisplay}
                    </span>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-base md:text-lg text-card-foreground mb-1.5 line-clamp-2 hover:text-primary transition-colors">
                    {title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3" title={`Instructor: ${creatorName}`}>
                    <User className="size-3.5 flex-shrink-0" />
                    <span className="truncate">{creatorName}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground mt-auto pt-3">
                    <MetaItem icon={Clock} value={duration} title="Duration" />
                    <MetaItem icon={BookOpen} value={lessonCount.toString()} title="Lessons" />
                    <MetaItem icon={TrendingUp} value={difficulty} title="Difficulty" />
                    <MetaItem icon={Globe} value={language} title="Language" />
                    <MetaItem icon={CalendarCheck2} value={creationDate} title="Created" />
                    <MetaItem icon={CalendarClock} value={updateDate} title="Last Updated" />
                </div>
                <div className="pt-4 mt-auto">
                    <Button variant={buttonVariant} size="sm" className="w-full text-xs" onClick={buttonAction} icon={buttonIcon}>
                        {buttonText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;