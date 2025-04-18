import React from 'react';
// If using Markdown: import ReactMarkdown from 'react-markdown';

const CourseDetailDescription = ({ description }) => {
    if (!description) {
        return null;
    }

    return (
        <div className="w-full">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-foreground">Course Description</h2>
            <div className="card p-6">
                {/* Use Tailwind Typography plugin for nice formatting */}
                {/* Add prose-invert for dark mode */}
                <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert text-foreground/90 dark:text-foreground/80">
                    {/* Simple rendering: Split by newline for basic paragraphs */}
                    {description.split('\n').map((paragraph, index) => (
                        paragraph.trim() ? <p key={index}>{paragraph}</p> : null // Render non-empty paragraphs
                    ))}
                    {/* --- OR --- */}
                    {/* If using Markdown: */}
                    {/* <ReactMarkdown>{description}</ReactMarkdown> */}
                </div>
            </div>
        </div>
    );
};
// Remember to install and configure @tailwindcss/typography if using prose classes

export default CourseDetailDescription;