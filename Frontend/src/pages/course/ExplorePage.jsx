import React, { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { fetchExploreCourses } from "../../services/api";
import CourseCard from "../../components/course/CourseCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageLoader from "../../components/common/PageLoader";
import { useToast } from "../../hooks/useToast";
import Input from "../../components/common/Input";

const NAVIGATION_LINK = "explore";

const ExplorePage = () => {
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { error: showErrorToast } = useToast();

    useEffect(() => {
        const loadCourses = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchExploreCourses();
                setCourses(data.courses || []);
            } catch (err) {
                console.error("Error fetching explore courses:", err);
                setError("Failed to load courses. Please ensure you are logged in and try again.");
                showErrorToast(err.message || "Failed to load courses.");
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        loadCourses();
    }, []);

    const filteredCourses = useMemo(() => {
        if (!searchQuery) return courses;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return courses.filter((course) =>
            course.course_title?.toLowerCase().includes(lowerCaseQuery) ||
            course.creator_name?.toLowerCase().includes(lowerCaseQuery) ||
            course.category_name?.toLowerCase().includes(lowerCaseQuery)
        );
    }, [courses, searchQuery]);

    if (loading) {
        return <PageLoader message="Loading Courses..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Explore Courses</h1>
                <div className="w-full sm:w-auto sm:max-w-xs">
                    <Input
                        id="search-courses" type="text" placeholder="Search title, instructor..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        icon={Search} aria-label="Search Courses"
                    />
                </div>
            </div>

            {error && (
                <div className="text-center py-10 text-destructive bg-destructive/10 rounded-md">
                    <p>{error}</p>
                </div>
            )}

            {!error && (
                <>
                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {filteredCourses.map((course) => (
                                <CourseCard
                                    key={course.course_id}
                                    course={course}
                                    viewType="explore"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-md">
                            <p>
                                {searchQuery
                                    ? "No courses match your search criteria."
                                    : "No courses available to explore right now. Check back later!"}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ExplorePage;