// FRONTEND/src/components/course/CourseAccordion.jsx
// Updated: Displays duration in seconds only
import React, { useState } from "react";
import { ChevronDown, PlayCircle, FileText, Lock, Edit, Trash2 } from "lucide-react";
import Button from "../common/Button";

const CourseAccordion = ({ lessons, isCreatorView = false, onEditLesson, onDeleteLesson }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const sortedLessons = React.useMemo(() =>
        [...(lessons || [])].sort((a, b) => (a.lesson_id ?? 0) - (b.lesson_id ?? 0)),
        [lessons]
    );

    // --- UPDATED: Format duration to show only seconds ---
    const formatDurationInSeconds = (seconds) => {
        if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) return null;
        return `${Math.round(seconds)}s`; // Show only seconds
    };
    // --- END UPDATE ---

    return (
        <div className="w-full space-y-2">
            {sortedLessons.map((lesson, index) => (
                <div key={lesson.lesson_id || index} className="card overflow-hidden border border-border rounded-md">
                    <button
                        id={`lesson-button-${lesson.lesson_id}`}
                        onClick={() => toggleAccordion(index)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors duration-200 ${openIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                        aria-expanded={openIndex === index}
                        aria-controls={`lesson-content-${lesson.lesson_id}`}
                    >
                        <span className="flex items-start gap-2 overflow-hidden mr-2">
                            <span className="text-sm font-normal text-muted-foreground w-6 text-right flex-shrink-0 pt-0.5">{index + 1}.</span>
                            <span className="flex-1">
                                <span className="block truncate">{lesson.lesson_title || "Untitled Lesson"}</span>
                                {/* Use updated duration format */}
                                {formatDurationInSeconds(lesson.duration) && (
                                    <span className="block text-xs text-muted-foreground/80 mt-0.5">{formatDurationInSeconds(lesson.duration)}</span>
                                )}
                            </span>
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {!isCreatorView && <Lock size={14} className="text-muted-foreground" />}
                            <ChevronDown
                                className={`h-5 w-5 transform transition-transform duration-300 ${openIndex === index ? "rotate-180" : "rotate-0"}`}
                            />
                        </div>
                    </button>

                    <div
                        id={`lesson-content-${lesson.lesson_id}`} role="region" aria-labelledby={`lesson-button-${lesson.lesson_id}`}
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="px-4 pb-4 pt-3 space-y-3 text-sm text-muted-foreground border-t border-border">
                            {lesson.lesson_description && (
                                <p className="whitespace-pre-wrap">{lesson.lesson_description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                {lesson.lesson_video_url && (
                                    <a href={lesson.lesson_video_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm inline-flex items-center gap-1 text-xs text-primary hover:text-primary">
                                        <PlayCircle size={14} /> Watch Video
                                    </a>
                                )}
                                {lesson.lesson_assignment_url && (
                                    <a href={lesson.lesson_assignment_url} target="_blank" rel="noopener noreferrer" download className="btn btn-ghost btn-sm inline-flex items-center gap-1 text-xs text-primary hover:text-primary">
                                        <FileText size={14} /> Download Resources
                                    </a>
                                )}
                                {isCreatorView && (
                                    <div className="ml-auto flex gap-2">
                                        <Button onClick={() => onEditLesson && onEditLesson(lesson)} variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit lesson">
                                            <Edit size={14} />
                                        </Button>
                                        <Button onClick={() => onDeleteLesson && onDeleteLesson(lesson.lesson_id)} variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" aria-label="Delete lesson">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CourseAccordion;