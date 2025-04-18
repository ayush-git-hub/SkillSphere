// FRONTEND/src/pages/course/CreatedCourseDetailPage.jsx
// Updated: Use AddLessonModal, add Enrollment Table section
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchCreatedCourseDetailForManage,
    deleteLesson,
    fetchCourseEnrollmentDetails // Import new API function
} from "../../services/api";
import CourseDetailCard from "../../components/course/CourseDetailCard";
import CourseAccordion from "../../components/course/CourseAccordion";
// Removed: import AddLessonForm from "../../components/course/AddLessonForm";
import AddLessonModal from "../../components/course/AddLessonModal"; // Import the modal
import CourseEnrollmentTable from "../../components/course/CourseEnrollmentTable"; // Import the table
import PageLoader from "../../components/common/PageLoader";
import { useToast } from "../../hooks/useToast";
import AboutInstructor from "../../components/course/AboutInstructor";
import NotFoundPage from "../NotFoundPage";
import UpdateLessonModal from "../../components/course/UpdateLessonModal";
import UpdateCourseModal from "../../components/course/UpdateCourseModal";
import Button from "../../components/common/Button";
import { Edit, Plus } from "lucide-react"; // Import Plus icon

const CreatedCourseDetailPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [instructor, setInstructor] = useState(null);
    const [enrollmentData, setEnrollmentData] = useState(null); // State for enrollment details
    const [loading, setLoading] = useState(true);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false); // Separate loading for enrollments
    const [error, setError] = useState(null);
    const { error: showErrorToast, success: showSuccessToast } = useToast();

    // State for modals
    const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
    const [lessonToEdit, setLessonToEdit] = useState(null);
    const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
    const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false); // State for Add Lesson Modal

    // Fetch course data for management
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

    // Fetch enrollment details
    const fetchEnrollments = useCallback(async () => {
        setLoadingEnrollments(true);
        try {
            const data = await fetchCourseEnrollmentDetails(courseId);
            setEnrollmentData(data); // API returns the full structure directly
        } catch (err) {
            console.error("Error fetching enrollment details:", err);
            // Don't show toast for this, maybe just log or display subtle error
            // showErrorToast(err.message || "Could not load enrollment details.");
            setEnrollmentData(null);
        } finally {
            setLoadingEnrollments(false);
        }
    }, [courseId]);


    useEffect(() => {
        fetchCourseData(true);
        fetchEnrollments(); // Fetch enrollments when component loads
    }, [fetchCourseData, fetchEnrollments]);

    // --- Modal Handlers ---
    const openEditLessonModal = (lesson) => { setLessonToEdit(lesson); setIsEditLessonModalOpen(true); };
    const closeEditLessonModal = () => { setIsEditLessonModalOpen(false); setLessonToEdit(null); };
    const openEditCourseModal = () => setIsEditCourseModalOpen(true);
    const closeEditCourseModal = () => setIsEditCourseModalOpen(false);
    const openAddLessonModal = () => setIsAddLessonModalOpen(true); // Open Add Lesson Modal
    const closeAddLessonModal = () => setIsAddLessonModalOpen(false); // Close Add Lesson Modal

    // --- Action Handlers ---
    const handleLessonAdded = () => {
        showSuccessToast("Lesson added successfully!");
        fetchCourseData(false); // Refetch course data (lesson count might change)
    };
    const handleLessonUpdated = () => { fetchCourseData(false); }; // Refetch course data
    const handleCourseUpdated = () => { fetchCourseData(false); fetchEnrollments(); }; // Refetch both course & enrollments (title might change)
    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm("Are you sure you want to delete this lesson? Associated files will be removed from storage.")) {
            setLoading(true);
            try {
                await deleteLesson(courseId, lessonId);
                showSuccessToast("Lesson deleted successfully.");
                fetchCourseData(false); // Refresh list
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
                <Button variant="primary" size="sm" onClick={openAddLessonModal}> {/* Button to open Add Lesson Modal */}
                    <Plus size={14} className="mr-2" /> Add Lesson
                </Button>
            </div>

            <CourseDetailCard
                course={course}
                enrollButtonEnable={false}
                // Pass average rating from course object itself (calculated on backend)
                averageRating={course.average_rating ?? null}
            />

            {instructor && <AboutInstructor creator={instructor} />}

            {/* Enrollment Details Section */}
            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground border-b border-border pb-2">Enrollment Dashboard</h2>
                {loadingEnrollments ? (
                    <div className="flex justify-center items-center py-6"><PageLoader size="h-8 w-8" /></div>
                ) : (
                    <CourseEnrollmentTable enrollmentData={enrollmentData} />
                )}
            </div>

            {/* Manage Lessons Section */}
            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground border-b border-border pb-2">Manage Course Content</h2>
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

            {/* REMOVED inline AddLessonForm */}
            {/* <div className="space-y-6">...</div> */}

            {/* Modals */}
            {isEditLessonModalOpen && lessonToEdit && (
                <UpdateLessonModal courseId={courseId} lessonData={lessonToEdit} closeModalFunc={closeEditLessonModal} onUpdateSuccess={handleLessonUpdated} />
            )}
            {isEditCourseModalOpen && course && (
                <UpdateCourseModal courseData={course} closeModalFunc={closeEditCourseModal} onUpdateSuccess={handleCourseUpdated} />
            )}
            {isAddLessonModalOpen && ( // Render Add Lesson Modal conditionally
                <AddLessonModal courseId={courseId} closeModalFunc={closeAddLessonModal} onLessonAdded={handleLessonAdded} />
            )}
        </div>
    );
};

export default CreatedCourseDetailPage;