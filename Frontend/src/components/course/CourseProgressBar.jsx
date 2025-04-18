// FRONTEND/src/components/course/CourseProgressBar.jsx
// New component for displaying progress visually
import React from 'react';

const CourseProgressBar = ({ completed, total }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Determine color based on completion
    const barColorClass = percentage === 100 ? 'bg-green-500' : 'bg-primary';

    return (
        <div className="w-full space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-foreground">Progress</span>
                <span className="text-muted-foreground">{completed} / {total} Lessons</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                    className={`h-2 rounded-full ${barColorClass} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`Course progress: ${percentage}%`}
                ></div>
            </div>
            <div className="text-right text-xs font-semibold text-primary">
                {percentage}% Complete
            </div>
        </div>
    );
};

export default CourseProgressBar;