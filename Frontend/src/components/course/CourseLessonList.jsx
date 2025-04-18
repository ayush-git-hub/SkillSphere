// src/components/course/CourseLessonList.jsx
// Updated: Removed lesson_order, uses lesson_id for key, sorts by lesson_id
import React from 'react';
import { Lock, PlayCircle } from 'lucide-react';

const CourseLessonList = ({
    lessons,
    selectedLessonId,
    onLessonClick,
    isLockedPreview = false,
    isEnrolledView = false,
}) => {

    // Ensure lessons is always an array and sort by lesson_id
    const sortedLessons = React.useMemo(() =>
        [...(lessons || [])].sort((a, b) => (a.lesson_id ?? 0) - (b.lesson_id ?? 0)),
        [lessons]
    );

    const title = isEnrolledView ? "Course Content" : "Course Preview";

    return (
        <div className="w-full">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">{title}</h2>
            {sortedLessons.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4 bg-card border border-border rounded-md">No lessons available.</p>
            ) : (
                <div className="space-y-2">
                    {sortedLessons.map((lesson, index) => {
                        const isSelected = isEnrolledView && lesson.lesson_id === selectedLessonId;
                        const canClick = isEnrolledView && typeof onLessonClick === 'function';

                        return (
                            <button
                                key={lesson.lesson_id} // Use lesson_id as key
                                onClick={canClick ? () => onLessonClick(lesson) : undefined}
                                disabled={!canClick}
                                className={`w-full text-left rounded-md border shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isSelected
                                    ? 'bg-accent border-primary/50 ring-1 ring-primary/50'
                                    : 'bg-card border-border'
                                    } ${canClick
                                        ? 'cursor-pointer hover:bg-accent/50'
                                        : 'cursor-default opacity-80'
                                    }`
                                }
                                aria-current={isSelected ? 'step' : 'false'}
                            >
                                <div className="flex w-full items-center justify-between px-3 py-2.5 md:px-4 md:py-3">
                                    <span className="flex items-start gap-2 overflow-hidden mr-2">
                                        {/* Display index+1 for visual order */}
                                        <span className="text-sm font-normal text-muted-foreground pt-px w-6 text-right flex-shrink-0">{index + 1}.</span>
                                        <span className={`flex-1 font-medium text-sm ${isSelected ? 'text-accent-foreground' : 'text-card-foreground'}`}>
                                            {lesson.lesson_title || "Untitled Lesson"}
                                            {/* Display duration if available */}
                                            {/* Convert seconds to minutes display if needed */}
                                            {lesson.duration && lesson.duration > 0 && (
                                                <span className="block text-xs font-normal text-muted-foreground/80 mt-0.5">{Math.ceil(lesson.duration / 60)} min</span>
                                            )}
                                        </span>
                                    </span>
                                    <div className="flex-shrink-0 ml-2">
                                        {isLockedPreview && <Lock size={16} className="text-muted-foreground" />}
                                        {isSelected && <PlayCircle size={16} className="text-accent-foreground" />}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CourseLessonList;