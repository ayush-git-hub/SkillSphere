// FRONTEND/src/pages/course/EnrolledCourseDetailPage.jsx
// Updated: Display Progress Bar
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEnrolledCourseDetail, fetchReviewsForCourse, markLessonComplete } from "../../services/api"; // Added markLessonComplete
import PageLoader from '../../components/common/PageLoader';
import { useToast } from '../../hooks/useToast';
import CourseLessonList from '../../components/course/CourseLessonList';
import ReviewForm from '../../components/course/ReviewForm';
import AboutInstructor from '../../components/course/AboutInstructor';
import NotFoundPage from '../NotFoundPage';
import CourseDetailCard from '../../components/course/CourseDetailCard';
import CourseProgressBar from '../../components/course/CourseProgressBar'; // Import Progress Bar
import { useAuthContext } from '../../contexts/AuthContext';

const EnrolledCourseDetailPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const { user } = useAuthContext();
    const userId = user?.user_id;

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [instructor, setInstructor] = useState(null);
    const [activeLesson, setActiveLesson] = useState(null);
    const [averageRating, setAverageRating] = useState(null);
    const [enrollmentDetails, setEnrollmentDetails] = useState(null); // Store enrollment details
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to reload data, including enrollment details
    const loadCourseData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        setError(null);
        try {
            const courseDetailsData = await fetchEnrolledCourseDetail(courseId);
            if (courseDetailsData.course) {
                setCourse(courseDetailsData.course);
                const sortedLessons = (courseDetailsData.lessons || []).sort((a, b) => (a.lesson_id ?? 0) - (b.lesson_id ?? 0));
                setLessons(sortedLessons);
                setInstructor(courseDetailsData.course.creator || null);
                setEnrollmentDetails(courseDetailsData.course.enrollment_details || null); // Store enrollment info

                if (sortedLessons.length > 0 && !activeLesson) {
                    setActiveLesson(sortedLessons[0]); // Set initial active lesson only once
                } else if (sortedLessons.length === 0) {
                    setActiveLesson(null);
                }

                try {
                    const reviewData = await fetchReviewsForCourse(courseId);
                    const reviews = reviewData.reviews || [];
                    setAverageRating(reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0);
                } catch (reviewError) {
                    setAverageRating(null); console.warn("Could not fetch reviews for rating:", reviewError);
                }

            } else { throw new Error(courseDetailsData.message || "Failed to fetch course details"); }
        } catch (err) {
            console.error("Fetch enrolled course detail error:", err);
            if (err.message?.includes('404') || err.message?.includes('not enrolled')) {
                setError("Course not found or you are not enrolled.");
            } else {
                setError("Could not load course content."); showErrorToast(err.message || "Could not load course content.");
            }
            setCourse(null); setLessons([]); setInstructor(null); setAverageRating(null); setEnrollmentDetails(null);
        } finally { if (showLoader) setLoading(false); }
        // Added activeLesson to dependencies to avoid resetting it unnecessarily
    }, [courseId, showErrorToast, activeLesson]);

    useEffect(() => { loadCourseData(); }, [courseId]); // Load initially based on courseId only

    const handleLessonClick = useCallback((lesson) => {
        setActiveLesson(lesson);
        // Optional: Scroll to video on mobile
        const videoElement = document.getElementById('lesson-video-player');
        if (videoElement && window.innerWidth < 1024) {
            videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    // --- Handle Marking Lesson Complete ---
    const handleCompleteLesson = async (lessonIdToComplete) => {
        if (!lessonIdToComplete) return;

        // Optional: Add UI feedback (e.g., disable button)
        try {
            const updatedEnrollmentData = await markLessonComplete(courseId, lessonIdToComplete);
            if (updatedEnrollmentData.enrollment) {
                setEnrollmentDetails(updatedEnrollmentData.enrollment); // Update local state
                showSuccessToast("Progress updated!");
            }
            // Potentially refetch full data if other things might change:
            // loadCourseData(false);
        } catch (err) {
            showErrorToast(err.message || "Failed to update progress.");
        } finally {
            // Remove UI feedback
        }
    };
    // --- End Handle Marking Lesson Complete ---

    if (loading) return <PageLoader message="Loading Course..." />;
    if (error && error.includes("not found or you are not enrolled")) return <NotFoundPage />;
    if (error) return <div className="container py-10 text-center text-destructive">{error}</div>;
    if (!course) return <NotFoundPage />;

    // Calculate progress values safely
    const completedLessons = enrollmentDetails?.lessons_completed ?? 0;
    const totalLessons = enrollmentDetails?.total_lessons ?? (lessons.length > 0 ? lessons.length : 0); // Fallback to lessons array length


    return (
        <div className="space-y-8 md:space-y-10">
            <CourseDetailCard
                course={course}
                enrollButtonEnable={false}
                isEnrolled={true}
                averageRating={averageRating}
            />

            {/* --- Progress Bar Section --- */}
            {totalLessons > 0 && (
                <div className="card p-4 md:p-5">
                    <CourseProgressBar
                        completed={completedLessons}
                        total={totalLessons}
                    />
                </div>
            )}
            {/* --- End Progress Bar Section --- */}


            <div className='lg:flex lg:gap-8'>
                <div className="lg:flex-1 space-y-6 mb-8 lg:mb-0">
                    <div id="lesson-video-player" className="aspect-video rounded-lg overflow-hidden bg-card border border-border shadow-md lg:sticky lg:top-16 z-10">
                        {activeLesson?.lesson_video_url ? (
                            <video key={activeLesson.lesson_id} controls autoPlay preload="metadata" className="w-full h-full" poster={course.thumbnail_url}>
                                <source src={activeLesson.lesson_video_url} type={activeLesson.lesson_video_name?.includes('.webm') ? 'video/webm' : 'video/mp4'} />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                                <span>{lessons.length > 0 ? (activeLesson ? "Video not available" : "Select a lesson") : "No lessons yet"}</span>
                            </div>
                        )}
                    </div>
                    {activeLesson && (
                        <div className="card p-4 md:p-6">
                            <h2 className="text-lg md:text-xl font-semibold mb-3 text-card-foreground">{activeLesson.lesson_title}</h2>
                            {activeLesson.lesson_description && <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{activeLesson.lesson_description}</p>}
                            <div className="flex flex-wrap gap-4 items-center">
                                {activeLesson.lesson_assignment_url && <a href={activeLesson.lesson_assignment_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" download> Download Resources </a>}
                                {/* --- Add 'Mark as Complete' Button --- */}
                                {/* TO DO: Check if lesson is already complete before showing/enabling button */}
                                <button
                                    onClick={() => handleCompleteLesson(activeLesson.lesson_id)}
                                    className="btn btn-secondary btn-sm ml-auto" // Style as needed
                                // disabled={isLessonComplete(activeLesson.lesson_id)} // Add logic to disable if complete
                                >
                                    Mark as Complete
                                </button>
                                {/* --- End Button --- */}
                            </div>
                        </div>
                    )}
                </div>
                <aside className="lg:w-[320px] xl:w-[360px] lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pb-10">
                    {/* TODO: Add visual indication for completed lessons in the list */}
                    <CourseLessonList lessons={lessons} selectedLessonId={activeLesson?.lesson_id} onLessonClick={handleLessonClick} isEnrolledView={true} />
                </aside>
            </div>

            <hr className="border-border" />
            <div className='space-y-8 md:space-y-10'>
                {instructor && <AboutInstructor creator={instructor} />}
                {userId && courseId && <ReviewForm courseId={parseInt(courseId, 10)} userId={userId} />}
            </div>
        </div>
    );
};

export default EnrolledCourseDetailPage;