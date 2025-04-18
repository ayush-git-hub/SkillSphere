// FRONTEND/src/pages/AuthorProfilePage.jsx
// New Page for Author Details
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserDetails } from '../../services/api'; // Assuming API function exists
import PageLoader from '../../components/common/PageLoader';
import CourseCard from '../../components/course/CourseCard';
import NotFoundPage from '../NotFoundPage';
import { useToast } from '../../hooks/useToast';
import { useAuthContext } from '../../contexts/AuthContext'; // To check enrolled status
import PlaceholderAvatar from '../../assets/svgs/placeholder-image.svg';

const AuthorProfilePage = () => {
    const { authorId } = useParams();
    const navigate = useNavigate();
    const { error: showErrorToast } = useToast();
    const { user: currentUser, isAuthenticated } = useAuthContext(); // Get current user

    const [authorDetails, setAuthorDetails] = useState(null);
    const [createdCourses, setCreatedCourses] = useState([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set()); // Track current user's enrollments
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch enrolled courses for the *current* user to determine button action
    useEffect(() => {
        const loadEnrolled = async () => {
            if (isAuthenticated && currentUser?.user_id) {
                try {
                    // This is a slight inefficiency if called elsewhere, consider caching in context
                    const { fetchEnrolledCourses } = await import('../../services/api');
                    const enrolledData = await fetchEnrolledCourses();
                    const ids = new Set((enrolledData.courses || []).map(c => c.course_id));
                    setEnrolledCourseIds(ids);
                } catch (err) {
                    console.warn("Could not fetch enrolled courses for author profile view:", err);
                }
            }
        };
        loadEnrolled();
    }, [isAuthenticated, currentUser?.user_id]);


    // Fetch author details
    const loadAuthorData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await fetchUserDetails(authorId); // Fetch details for the authorId from URL
            if (data.user) {
                setAuthorDetails(data.user);
                setCreatedCourses(data.created_courses || []);
            } else {
                throw new Error("Author data not found");
            }
        } catch (err) {
            console.error("Error fetching author details:", err);
            if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
                setError("Author not found.");
            } else {
                setError("Could not load author profile.");
                showErrorToast(err.message || "Could not load author profile.");
            }
            setAuthorDetails(null); setCreatedCourses([]);
        } finally { setLoading(false); }
    }, [authorId, showErrorToast]);

    useEffect(() => {
        loadAuthorData();
    }, [loadAuthorData]);

    const handleCourseClick = (courseId) => {
        if (!courseId) return;
        // Check if the *current logged-in user* is enrolled in the clicked course
        if (isAuthenticated && enrolledCourseIds.has(courseId)) {
            navigate(`/enrolled-course/${courseId}`); // Go to enrolled view
        } else {
            navigate(`/explore/${courseId}`); // Go to explore view
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); }
        catch (error) { return 'Invalid Date'; }
    };

    if (loading) return <PageLoader message="Loading Author Profile..." />;
    if (error === "Author not found.") return <NotFoundPage />;
    if (error) return <div className="container py-10 text-center text-destructive">{error}</div>;
    if (!authorDetails) return <NotFoundPage />;

    const profileImageUrl = authorDetails.profile_image_original_url || PlaceholderAvatar;

    return (
        <div className="space-y-8">
            {/* Author Header */}
            <div className="card p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img
                    src={profileImageUrl}
                    alt={`${authorDetails.name}'s profile`}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-border shadow-lg bg-muted flex-shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderAvatar; }}
                />
                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-card-foreground mb-1">{authorDetails.name}</h1>
                    <p className="text-muted-foreground mb-3">{authorDetails.email}</p>
                    {/* Add Bio/Tagline here if available from backend */}
                    {/* <p className="text-sm text-muted-foreground mb-3">{authorDetails.tagline || 'Passionate Educator'}</p> */}
                    {/* <p className="text-sm text-muted-foreground leading-relaxed">{authorDetails.bio || 'No bio available.'}</p> */}
                    <p className="text-xs text-muted-foreground mt-2">Member Since: {formatDate(authorDetails.date_of_joining)}</p>
                </div>
            </div>

            {/* Courses by Author */}
            <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                    Courses by {authorDetails.name} ({createdCourses.length})
                </h2>
                {createdCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {createdCourses.map((course) => (
                            <div key={course.course_id} onClick={() => handleCourseClick(course.course_id)}>
                                <CourseCard
                                    course={course}
                                    // Override navigation link behavior with onClick handler above
                                    navigationLink={null} // Prevent default navigation
                                    isEnrolled={isAuthenticated && enrolledCourseIds.has(course.course_id)} // Determine button text/style
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-md">
                        <p>{authorDetails.name} hasn't created any courses yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthorProfilePage;