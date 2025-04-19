import React from "react";
import { Plus } from "lucide-react";

const CreateCourseCard = ({ onClick }) => {
    return (
        <button
            className="card border-2 border-dashed border-border hover:border-primary/50 bg-transparent hover:bg-accent/30 rounded-lg w-full aspect-video sm:aspect-auto sm:min-h-[350px] flex items-center justify-center transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-4" // Use card, responsive height
            onClick={onClick}
            aria-label="Create New Course"
        >
            <div className="text-center space-y-2 text-muted-foreground group-hover:text-foreground transition-colors">
                <Plus className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 transition-transform group-hover:scale-110 duration-200" />
                <h3 className="font-semibold text-base sm:text-lg">
                    Create New Course
                </h3>
                <p className="text-xs sm:text-sm">
                    Start building your next course!
                </p>
            </div>
        </button>
    );
};

export default CreateCourseCard;