import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEnrolledCourseDetail, fetchReviewsForCourse, markLessonComplete } from "../../services/api";
import PageLoader from '../../components/common/PageLoader';
import { useToast } from '../../hooks/useToast';
import CourseLessonList from '../../components/course/CourseLessonList';
import ReviewForm from '../../components/course/ReviewForm';
import AboutInstructor from '../../components/course/AboutInstructor';
import NotFoundPage from '../NotFoundPage';
import CourseDetailCard from '../../components/course/CourseDetailCard';
import CourseProgressBar from '../../components/course/CourseProgressBar';
import { useAuthContext } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import { Timer, CheckCircle } from 'lucide-react';

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
    const [enrollmentDetails, setEnrollmentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCompletingLesson, setIsCompletingLesson] = useState(false);

    const lessonTimerIntervalRef = useRef(null);
    const activeLessonStartTimeRef = useRef(null);

    const isLessonConsideredComplete = useCallback((lessonId) => {
        if (!enrollmentDetails || !lessons || lessons.length === 0) return false;
        const lessonIndex = lessons.findIndex(l => l.lesson_id === lessonId);
        return lessonIndex !== -1 && lessonIndex < enrollmentDetails.lessons_completed;
    }, [lessons, enrollmentDetails]);

    const isActiveLessonComplete = useMemo(() => {
        return activeLesson ? isLessonConsideredComplete(activeLesson.lesson_id) : false;
    }, [activeLesson, isLessonConsideredComplete]);

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
                setEnrollmentDetails(courseDetailsData.course.enrollment_details || null);

                if (showLoader && sortedLessons.length > 0) {
                    setActiveLesson(sortedLessons[0]);
                } else if (sortedLessons.length === 0) {
                    setActiveLesson(null);
                }

                try {
                    const reviewData = await fetchReviewsForCourse(courseId);
                    const reviews = reviewData.reviews || [];
                    setAverageRating(reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0);
                } catch (reviewError) { setAverageRating(null); console.warn("Could not fetch reviews:", reviewError); }

            } else { throw new Error(courseDetailsData.message || "Failed to fetch course details"); }
        } catch (err) {
            console.error("Fetch enrolled course detail error:", err);
            if (err.message?.includes('404') || err.message?.toLowerCase().includes('not enrolled') || err.message?.toLowerCase().includes('not found')) {
                setError("Course not found or you are not enrolled.");
            } else {
                setError("Could not load course content."); showErrorToast(err.message || "Could not load course content.");
            }
            setCourse(null); setLessons([]); setInstructor(null); setAverageRating(null); setEnrollmentDetails(null);
        } finally { if (showLoader) setLoading(false); }
    }, [courseId, showErrorToast]);

    useEffect(() => {
        loadCourseData(true);
    }, [loadCourseData, courseId]);

    useEffect(() => {
        const stopTimer = () => {
            if (lessonTimerIntervalRef.current) {
                clearInterval(lessonTimerIntervalRef.current);
                lessonTimerIntervalRef.current = null;
            }
            activeLessonStartTimeRef.current = null;
        };

        const isComplete = activeLesson ? isLessonConsideredComplete(activeLesson.lesson_id) : true;

        if (activeLesson && !isComplete) {
            stopTimer();
            console.log(`Lesson Timer: Starting for UNCOMPLETED lesson ${activeLesson.lesson_id}`);
            activeLessonStartTimeRef.current = Date.now();
            lessonTimerIntervalRef.current = setInterval(() => {
            }, 15000);

        } else {
            if (activeLesson) {
                console.log(`Lesson Timer: NOT starting for COMPLETED lesson ${activeLesson.lesson_id}`);
            }
            stopTimer();
        }

        return () => {
            stopTimer();
        };
    }, [activeLesson, isLessonConsideredComplete]);


    const handleLessonClick = useCallback((lesson) => {
        setActiveLesson(lesson);
        const videoElement = document.getElementById('lesson-video-player');
        if (videoElement && window.innerWidth < 1024) {
            videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleCompleteLesson = async (lessonIdToComplete) => {
        if (!lessonIdToComplete || isCompletingLesson) return;
        const isAlreadyComplete = isLessonConsideredComplete(lessonIdToComplete);
        if (isAlreadyComplete) {
            showErrorToast("This lesson is already marked as complete based on current progress.");
            return;
        }

        setIsCompletingLesson(true);

        let timeSpentIncrement = 0;
        if (activeLessonStartTimeRef.current && activeLesson?.lesson_id === lessonIdToComplete) {
            const endTime = Date.now();
            timeSpentIncrement = (endTime - activeLessonStartTimeRef.current) / 1000;
            console.log(`Lesson Timer: Calculated time for lesson ${lessonIdToComplete}: ${timeSpentIncrement.toFixed(1)}s`);

            if (lessonTimerIntervalRef.current) {
                clearInterval(lessonTimerIntervalRef.current);
                lessonTimerIntervalRef.current = null;
            }
            activeLessonStartTimeRef.current = null;
        } else {
            console.warn(`Lesson Timer: Timer wasn't running or lesson changed before completion for ${lessonIdToComplete}. Sending 0 time.`);
        }

        try {
            const updatedEnrollmentResp = await markLessonComplete(
                courseId,
                lessonIdToComplete,
                timeSpentIncrement
            );

            if (updatedEnrollmentResp.enrollment) {
                setEnrollmentDetails(updatedEnrollmentResp.enrollment);
                showSuccessToast("Progress & Time updated!");
            } else {
                console.warn("Mark complete response structure unexpected:", updatedEnrollmentResp);
                loadCourseData(false);
            }
        } catch (err) {
            showErrorToast(err.message || "Failed to update progress.");
        } finally {
            setIsCompletingLesson(false);
        }
    };

    if (loading) return <PageLoader message="Loading Course..." />;
    if (error === "Course not found or you are not enrolled.") return <NotFoundPage />;
    if (error) return <div className="container py-10 text-center text-destructive">{error}</div>;
    if (!course) return <NotFoundPage />;

    const completedLessons = enrollmentDetails?.lessons_completed ?? 0;
    const totalLessons = enrollmentDetails?.total_lessons ?? (lessons.length > 0 ? lessons.length : 0);
    const totalTimeSpentSeconds = enrollmentDetails?.time_spent_seconds ?? 0;

    const formatTotalTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const totalSecondsRounded = Math.round(seconds);
        const hrs = Math.floor(totalSecondsRounded / 3600);
        const mins = Math.floor((totalSecondsRounded % 3600) / 60);
        const secs = totalSecondsRounded % 60;
        let timeString = "";
        if (hrs > 0) timeString += `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        else timeString += `${mins}:${secs.toString().padStart(2, '0')}`;
        return timeString;
    };

    return (
        <div className="space-y-8 md:space-y-10">
            <CourseDetailCard course={course} enrollButtonEnable={false} isEnrolled={true} averageRating={averageRating} />
            <div className="card p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {totalLessons > 0 && (<div> <CourseProgressBar completed={completedLessons} total={totalLessons} /> </div>)}
                <div className="flex flex-col items-start md:items-end justify-center">
                    <span className="text-xs font-medium text-muted-foreground mb-1">Total Course Time</span>
                    <div className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
                        <Timer size={18} className="text-primary" />
                        <span>{`${formatTotalTime(totalTimeSpentSeconds)} min`}</span>
                    </div>
                </div>
            </div>
            <div className='lg:flex lg:gap-8'>
                <div className="lg:flex-1 mb-8 lg:mb-0">
                    <div className="lg:sticky lg:top-16 space-y-6">
                        <div id="lesson-video-player" className="aspect-video rounded-lg overflow-hidden bg-background border border-border shadow-md">
                            {activeLesson?.lesson_video_url ? (
                                <video key={activeLesson.lesson_id} controls autoPlay preload="metadata" className="w-full h-full" poster={course.thumbnail_url}>
                                    <source src={activeLesson.lesson_video_url} type={activeLesson.lesson_video_name?.includes('.webm') ? 'video/webm' : 'video/mp4'} />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (<div className="w-full h-full flex items-center justify-center text-muted-foreground bg-card"><span>{lessons.length > 0 ? (activeLesson ? "Video not available" : "Select a lesson") : "No lessons yet"}</span></div>)}
                        </div>
                        {activeLesson && (
                            <div className="card p-4 md:p-6">
                                <h2 className="text-lg md:text-xl font-semibold mb-3 text-card-foreground">{activeLesson.lesson_title}</h2>
                                {activeLesson.lesson_description && <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{activeLesson.lesson_description}</p>}
                                <div className="flex flex-wrap gap-4 items-center">
                                    {activeLesson.lesson_assignment_url && (<a href={activeLesson.lesson_assignment_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" download> Download Resources </a>)}
                                    <Button
                                        onClick={() => handleCompleteLesson(activeLesson.lesson_id)}
                                        variant={isActiveLessonComplete ? "success" : "secondary"}
                                        size="sm"
                                        className="ml-auto"
                                        isLoading={isCompletingLesson}
                                        disabled={isCompletingLesson || isActiveLessonComplete}
                                    >
                                        {isActiveLessonComplete ? (
                                            <> <CheckCircle size={14} className="mr-1.5" /> Completed </>
                                        ) : (
                                            "Mark as Complete"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <aside className="lg:w-[320px] xl:w-[360px] lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pb-10">
                    <CourseLessonList
                        lessons={lessons}
                        selectedLessonId={activeLesson?.lesson_id}
                        onLessonClick={handleLessonClick}
                        isLessonComplete={isLessonConsideredComplete}
                        isEnrolledView={true}
                    />
                </aside>
            </div>
            <div className='space-y-8 md:space-y-10'>
                {instructor && <AboutInstructor creator={instructor} />}
                {userId && courseId && <ReviewForm courseId={parseInt(courseId, 10)} userId={userId} />}
            </div>
        </div>
    );
};

export default EnrolledCourseDetailPage;