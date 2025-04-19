
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchCreatedCourseDetailForManage,
    deleteLesson,
    fetchCourseEnrollmentDetails
} from "../../services/api";
import CourseDetailCard from "../../components/course/CourseDetailCard";
import CourseAccordion from "../../components/course/CourseAccordion";
import AddLessonModal from "../../components/course/AddLessonModal";
import CourseEnrollmentTable from "../../components/course/CourseEnrollmentTable";
import PageLoader from "../../components/common/PageLoader";
import { useToast } from "../../hooks/useToast";
import AboutInstructor from "../../components/course/AboutInstructor";
import NotFoundPage from "../NotFoundPage";
import UpdateLessonModal from "../../components/course/UpdateLessonModal";
import UpdateCourseModal from "../../components/course/UpdateCourseModal";
import Button from "../../components/common/Button";
import { Edit, Plus } from "lucide-react";

const CreatedCourseDetailPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [instructor, setInstructor] = useState(null);
    const [enrollmentData, setEnrollmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [error, setError] = useState(null);
    const { error: showErrorToast, success: showSuccessToast } = useToast();

    const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
    const [lessonToEdit, setLessonToEdit] = useState(null);
    const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);

    const fetchCourseData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        setError(null);
        try {
            const courseDetailsData = await fetchCreatedCourseDetailForManage(courseId);
            if (courseDetailsData.course) {
                setCourse(courseDetailsData.course);
                const sortedLessons = (courseDetailsData.lessons || []).sort((a, b) => (a.lesson_id ?? 0) - (b.lesson_id ?? 0));
                setLessons(sortedLessons);
                setInstructor(courseDetailsData.course.creator || null);
            } else {
                throw new Error(courseDetailsData.message || "Failed to fetch course details");
            }
        } catch (err) {
            console.error("Error fetching created course detail:", err);
            if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
                setError("Course not found or you do not have permission.");
            } else {
                setError("Could not load course editor. Please try again.");
                showErrorToast(err.message || "Could not load course editor.");
            }
            setCourse(null); setLessons([]); setInstructor(null);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [courseId, showErrorToast]);

    const fetchEnrollments = useCallback(async () => {
        setLoadingEnrollments(true);
        try {
            const data = await fetchCourseEnrollmentDetails(courseId);
            setEnrollmentData(data);
        } catch (err) {
            console.error("Error fetching enrollment details:", err);
            setEnrollmentData(null);
        } finally {
            setLoadingEnrollments(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourseData(true);
        fetchEnrollments();
    }, [fetchCourseData, fetchEnrollments]);

    const openEditLessonModal = (lesson) => { setLessonToEdit(lesson); setIsEditLessonModalOpen(true); };
    const closeEditLessonModal = () => { setIsEditLessonModalOpen(false); setLessonToEdit(null); };
    const openEditCourseModal = () => setIsEditCourseModalOpen(true);
    const closeEditCourseModal = () => setIsEditCourseModalOpen(false);
    const openAddLessonModal = () => setIsAddLessonModalOpen(true);
    const closeAddLessonModal = () => setIsAddLessonModalOpen(false);

    const handleLessonAdded = () => { showSuccessToast("Lesson added!"); fetchCourseData(false); };
    const handleLessonUpdated = () => { fetchCourseData(false); };
    const handleCourseUpdated = () => { fetchCourseData(false); fetchEnrollments(); };
    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm("Are you sure you want to delete this lesson? Associated files will be removed from storage.")) {
            setLoading(true);
            try {
                await deleteLesson(courseId, lessonId);
                showSuccessToast("Lesson deleted successfully.");
                fetchCourseData(false);
            } catch (err) {
                showErrorToast(err.message || "Failed to delete lesson.");
                setLoading(false);
            }
        }
    };

    if (loading) return <PageLoader message="Loading Course Editor..." />;
    if (error && error.includes("not found or you do not have permission")) return <NotFoundPage />;
    if (error) return <div className="container py-10 text-center text-destructive">{error}</div>;
    if (!course) return <NotFoundPage />;

    return (
        <div className="space-y-10">
            <div className="flex justify-end -mb-6 gap-2">
                <Button variant="outline" size="sm" onClick={openEditCourseModal}>
                    <Edit size={14} className="mr-2" /> Edit Course
                </Button>
                <Button variant="primary" size="sm" onClick={openAddLessonModal}>
                    <Plus size={14} className="mr-2" /> Add Lesson
                </Button>
            </div>

            <CourseDetailCard
                course={course}
                enrollButtonEnable={false}
                averageRating={course.average_rating ?? null}
            />

            {instructor && <AboutInstructor creator={instructor} />}

            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground  pb-2">Manage Course Content</h2>
                {lessons.length > 0 ? (
                    <CourseAccordion
                        lessons={lessons}
                        isCreatorView={true}
                        onEditLesson={openEditLessonModal}
                        onDeleteLesson={handleDeleteLesson}
                    />
                ) : (
                    <p className="text-muted-foreground text-center py-4 bg-card border border-border rounded-md">
                        No lessons added yet. Click "Add Lesson" above.
                    </p>
                )}
            </div>

            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground pb-2">Enrollment Dashboard</h2>
                {loadingEnrollments ? (
                    <div className="flex justify-center items-center py-6"><PageLoader size="h-8 w-8" /></div>
                ) : (
                    <CourseEnrollmentTable enrollmentData={enrollmentData} />
                )}
            </div>

            {isEditLessonModalOpen && lessonToEdit && (
                <UpdateLessonModal courseId={courseId} lessonData={lessonToEdit} closeModalFunc={closeEditLessonModal} onUpdateSuccess={handleLessonUpdated} />
            )}
            {isEditCourseModalOpen && course && (
                <UpdateCourseModal courseData={course} closeModalFunc={closeEditCourseModal} onUpdateSuccess={handleCourseUpdated} />
            )}
            {isAddLessonModalOpen && (
                <AddLessonModal courseId={courseId} closeModalFunc={closeAddLessonModal} onLessonAdded={handleLessonAdded} />
            )}
        </div>
    );
};

export default CreatedCourseDetailPage;