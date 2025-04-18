// Update
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchCreatedCourses } from "../../services/api"; // Correct API function
import CourseCard from "../../components/course/CourseCard";
import CreateCourseCard from "../../components/shared/CreateCourseCard";
import PageLoader from "../../components/common/PageLoader";
import { useToast } from "../../hooks/useToast";
import Input from "../../components/common/Input";

const NAVIGATION_LINK = "created-course";

const CreatedCoursePage = () => {
    const [createdCourses, setCreatedCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { error: showErrorToast } = useToast();

    useEffect(() => {
        const loadCourses = async () => {
            setLoading(true);
            setError(null);
            try {
                // Backend identifies user via token
                const data = await fetchCreatedCourses();
                // Backend returns { courses: [...] } in 'data'
                setCreatedCourses(data.courses || []);
            } catch (err) {
                console.error("Error fetching created courses:", err);
                setError("Failed to load your created courses.");
                showErrorToast(err.message || "Failed to load created courses.");
                setCreatedCourses([]);
            } finally {
                setLoading(false);
            }
        };
        loadCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredCourses = useMemo(() => {
        if (!searchQuery) return createdCourses;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return createdCourses.filter((course) =>
            course.course_title?.toLowerCase().includes(lowerCaseQuery)
        );
    }, [createdCourses, searchQuery]);

    const handleCreateCardClick = () => {
        navigate("/created-course/create-new-course");
    };

    if (loading) {
        return <PageLoader message="Loading Your Created Courses..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Created Courses</h1>
                <div className="w-full sm:w-auto sm:max-w-xs">
                    <Input
                        id="search-created-courses" type="text" placeholder="Search your courses..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        icon={Search} aria-label="Search Created Courses"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {/* Create Card */}
                        <CreateCourseCard onClick={handleCreateCardClick} />
                        {/* Existing Courses */}
                        {filteredCourses.map((course) => (
                            <CourseCard
                                key={course.course_id}
                                course={course}
                                navigationLink={NAVIGATION_LINK}
                                isCreatorView={true} // Pass flag for context (manage button)
                            />
                        ))}
                    </div>
                    {/* Message when no courses */}
                    {createdCourses.length === 0 && !searchQuery && (
                        <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-md mt-6 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                            <p>You haven't created any courses yet. Click the '+' card above to start!</p>
                        </div>
                    )}
                    {/* Message when search yields no results */}
                    {filteredCourses.length === 0 && searchQuery && (
                        <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-md mt-6 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                            <p>No created courses match your search.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CreatedCoursePage;