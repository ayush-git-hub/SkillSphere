// FRONTEND/src/pages/course/ExploreDetailPage.jsx
// Updated: Author Card Click, Course Card Click logic
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchExploreCourseDetail,
    enrollInCourse,
    fetchEnrolledCourses, // Needed to check enrollment for author's courses
    fetchReviewsForCourse
} from "../../services/api";
import CourseDetailCard from "../../components/course/CourseDetailCard";
import PageLoader from "../../components/common/PageLoader";
import { useToast } from "../../hooks/useToast";
import CourseLessonList from "../../components/course/CourseLessonList";
import CourseDetailDescription from "../../components/course/CourseDetailDescription";
import AboutInstructor from "../../components/course/AboutInstructor";
import CourseReviews from "../../components/course/CourseReviews";
import NotFoundPage from "../NotFoundPage";
import { useAuthContext } from '../../contexts/AuthContext'; // Import Auth context

const ExploreDetailPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const { user, isAuthenticated } = useAuthContext(); // Get user and auth status
    const userId = user?.user_id;

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [creator, setCreator] = useState(null);
    const [averageRating, setAverageRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set()); // Store IDs of user's enrolled courses
    const [error, setError] = useState(null);

    // Check if current user is enrolled in *this* course
    const checkEnrollment = useCallback(async () => {
        if (!userId || !courseId) return false;
        try {
            const enrolledData = await fetchEnrolledCourses(); // Fetch all enrolled courses
            const enrolledList = enrolledData.courses || [];
            const enrolledIdsSet = new Set(enrolledList.map(c => c.course_id));
            setEnrolledCourseIds(enrolledIdsSet); // Store the set for later use (author profile)
            return enrolledIdsSet.has(parseInt(courseId, 10)); // Check for *this* course
        } catch (err) {
            console.error("Failed to check enrollment status:", err);
            // Don't block loading if this fails, assume not enrolled
            setEnrolledCourseIds(new Set());
            return false;
        }
    }, [userId, courseId]);

    const loadData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const courseData = await fetchExploreCourseDetail(courseId);
            if (courseData.course) {
                setCourse(courseData.course);
                const sortedLessons = (courseData.lessons_overview || []).sort((a, b) => (a.lesson_id ?? 0) - (b.lesson_id ?? 0));
                setLessons(sortedLessons);
                setCreator(courseData.creator || null);

                try {
                    const reviewData = await fetchReviewsForCourse(courseId);
                    const reviews = reviewData.reviews || [];
                    setAverageRating(reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0);
                } catch (reviewError) {
                    setAverageRating(null); console.warn("Could not fetch reviews for rating:", reviewError);
                }

                // Check enrollment *after* fetching course data, only if logged in
                if (isAuthenticated) {
                    const enrolled = await checkEnrollment();
                    setIsAlreadyEnrolled(enrolled);
                } else {
                    setIsAlreadyEnrolled(false);
                    setEnrolledCourseIds(new Set());
                }

            } else { throw new Error("Course data not found"); }
        } catch (err) {
            console.error("Error loading course detail:", err);
            if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
                setError("Course not found.");
            } else {
                setError("Could not load course details."); showErrorToast(err.message || "Could not load course details.");
            }
            setCourse(null); setLessons([]); setCreator(null); setAverageRating(null);
        } finally { setLoading(false); }
    }, [courseId, showErrorToast, checkEnrollment, isAuthenticated]); // Add isAuthenticated dependency

    useEffect(() => { loadData(); }, [loadData]);

    const handleEnroll = async () => {
        if (!course || !isAuthenticated) {
            showErrorToast("Please log in to enroll.");
            navigate('/signin', { state: { from: window.location.pathname } }); return;
        }
        if (isAlreadyEnrolled) { showErrorToast("You are already enrolled."); return; }

        setEnrollLoading(true);
        try {
            await enrollInCourse(course.course_id);
            showSuccessToast("Enrollment successful! Redirecting...");
            setIsAlreadyEnrolled(true);
            setEnrolledCourseIds(prev => new Set(prev).add(course.course_id)); // Add to local set
            setTimeout(() => navigate(`/enrolled-course/${course.course_id}`), 1500);
        } catch (err) {
            console.error("Enrollment error:", err);
            showErrorToast(err.message || "Enrollment failed.");
            if (err.message?.toLowerCase().includes('already enrolled')) {
                setIsAlreadyEnrolled(true);
                setEnrolledCourseIds(prev => new Set(prev).add(course.course_id));
            }
            setEnrollLoading(false);
        }
    };

    // --- Author Card Click Handler ---
    const handleAuthorClick = () => {
        if (creator?.user_id) {
            // Navigate to a new Author Profile Page (you'll need to create this page and route)
            // This page will use the new `/users/{user_id}/details` backend route
            navigate(`/author/${creator.user_id}`);
        } else {
            console.warn("Cannot navigate to author profile: Creator ID missing.");
        }
    };
    // --- End Author Card Click Handler ---


    if (loading) return <PageLoader message="Loading Course Details..." />;
    if (error === "Course not found.") return <NotFoundPage />;
    if (error) return <div className="container py-10 text-center text-destructive">{error}</div>;
    if (!course) return <NotFoundPage />;

    // Determine if the current user is the creator
    const isCreator = isAuthenticated && creator && creator.user_id === userId;

    return (
        <div className="space-y-10">
            <CourseDetailCard
                course={course}
                enrollButtonEnable={!isAlreadyEnrolled && !isCreator} // Enable only if not enrolled AND not creator
                onEnrollClick={handleEnroll}
                isEnrolling={enrollLoading}
                isEnrolled={isAlreadyEnrolled}
                averageRating={averageRating}
            />

            {course.course_description && <CourseDetailDescription description={course.course_description} />}
            {lessons.length > 0 && <CourseLessonList lessons={lessons} isLockedPreview={true} />}

            {/* Wrap AboutInstructor in a clickable div */}
            {creator && (
                <div
                    onClick={handleAuthorClick}
                    role="button" // Make it behave like a button
                    tabIndex={0} // Make it focusable
                    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleAuthorClick()}
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md transition-shadow hover:shadow-md"
                    aria-label={`View profile and courses by ${creator.name}`}
                >
                    <AboutInstructor creator={creator} />
                </div>
            )}

            <CourseReviews courseId={courseId} />
        </div>
    );
};

export default ExploreDetailPage;