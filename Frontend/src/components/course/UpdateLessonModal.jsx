// src/components/course/UpdateLessonModal.jsx
// New component for updating lessons
import React, { useState, useEffect } from "react";
import { updateLesson } from "../../services/api"; // API function
import { useToast } from "../../hooks/useToast";
import { UploadCloud, FileText, X as CloseIcon } from "lucide-react";
import Input from "../common/Input";
import Button from "../common/Button";

const UpdateLessonModal = ({ courseId, lessonData, closeModalFunc, onUpdateSuccess }) => {
    const initialFormState = {
        lesson_title: "",
        lesson_description: "",
    };
    const [formData, setFormData] = useState(initialFormState);
    const [lessonVideo, setLessonVideo] = useState(null); // New video file
    const [lessonAssignment, setLessonAssignment] = useState(null); // New assignment file
    const [loading, setLoading] = useState(false);
    const [videoFileName, setVideoFileName] = useState(""); // For displaying new filename
    const [assignmentFileName, setAssignmentFileName] = useState(""); // For displaying new filename
    const { success: showSuccessToast, error: showErrorToast } = useToast();

    // Pre-fill form with existing lesson data
    useEffect(() => {
        if (lessonData) {
            setFormData({
                lesson_title: lessonData.lesson_title || "",
                lesson_description: lessonData.lesson_description || "",
            });
            // Reset file inputs on modal open
            setLessonVideo(null);
            setLessonAssignment(null);
            setVideoFileName("");
            setAssignmentFileName("");
        }
    }, [lessonData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        const maxSizeVideo = 500 * 1024 * 1024; // 500MB
        const maxSizeAssignment = 50 * 1024 * 1024; // 50MB

        if (file) {
            if (name === 'lesson_video' && file.size > maxSizeVideo) {
                showErrorToast(`Video file size cannot exceed ${maxSizeVideo / (1024 * 1024)}MB.`);
                e.target.value = ''; setLessonVideo(null); setVideoFileName(""); return;
            }
            if (name === 'lesson_assignment' && file.size > maxSizeAssignment) {
                showErrorToast(`Assignment file size cannot exceed ${maxSizeAssignment / (1024 * 1024)}MB.`);
                e.target.value = ''; setLessonAssignment(null); setAssignmentFileName(""); return;
            }

            if (name === 'lesson_video') {
                setLessonVideo(file); setVideoFileName(file.name);
            } else if (name === 'lesson_assignment') {
                setLessonAssignment(file); setAssignmentFileName(file.name);
            }
        } else {
            // Clear file state if selection is cancelled
            if (name === 'lesson_video') { setLessonVideo(null); setVideoFileName(""); }
            if (name === 'lesson_assignment') { setLessonAssignment(null); setAssignmentFileName(""); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.lesson_title) {
            showErrorToast("Lesson title is required."); setLoading(false); return;
        }

        const formPayload = new FormData();
        formPayload.append("lesson_title", formData.lesson_title);
        formPayload.append("lesson_description", formData.lesson_description || "");

        // Only append files if they are selected for update
        if (lessonVideo) {
            formPayload.append("lesson_video", lessonVideo);
        }
        if (lessonAssignment) {
            formPayload.append("lesson_assignment", lessonAssignment);
        }

        try {
            await updateLesson(courseId, lessonData.lesson_id, formPayload);
            showSuccessToast("Lesson updated successfully!");
            onUpdateSuccess(); // Callback to refresh data in parent
            closeModalFunc(); // Close modal
        } catch (error) {
            console.error("Update lesson error:", error);
            showErrorToast(error.message || "Failed to update lesson.");
        } finally {
            setLoading(false);
        }
    };

    if (!lessonData) return null; // Don't render if no lesson data

    return (
        // Modal Backdrop & Container
        <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4"
            onClick={closeModalFunc} role="dialog" aria-modal="true" aria-labelledby="update-lesson-title"
        >
            {/* Modal Content */}
            <div
                className="card w-full max-w-lg relative p-6 sm:p-8 max-h-[90vh] overflow-y-auto" // Allow scrolling
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <Button
                    variant="ghost" size="icon" onClick={closeModalFunc}
                    className="absolute top-3 right-3 h-8 w-8" aria-label="Close update lesson modal"
                >
                    <CloseIcon size={20} />
                </Button>

                {/* Title */}
                <h2 id="update-lesson-title" className="text-xl sm:text-2xl font-semibold mb-6 text-center text-card-foreground">Update Lesson</h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="update_lesson_title" label="Lesson Title" name="lesson_title"
                        value={formData.lesson_title} onChange={handleChange}
                        placeholder="e.g., Advanced State Management" required disabled={loading}
                    />

                    <div className="space-y-1">
                        <label htmlFor="update_lesson_description" className="block text-sm font-medium text-foreground">Lesson Description (Optional)</label>
                        <textarea id="update_lesson_description" name="lesson_description" value={formData.lesson_description}
                            onChange={handleChange} rows={4} className="textarea"
                            placeholder="Update lesson description..." disabled={loading}
                        />
                    </div>

                    {/* Video Upload */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">Update Lesson Video (Optional)</label>
                        <p className="text-xs text-muted-foreground mb-1">Current: {lessonData.lesson_video_url ? <a href={lessonData.lesson_video_url} target="_blank" rel="noreferrer" className="text-primary underline">View Video</a> : 'None'}</p>
                        <div className="relative border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors hover:border-muted-foreground">
                            <input id="update_lesson_video" type="file" accept="video/mp4,video/webm,video/ogg" name="lesson_video"
                                onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={loading} aria-label="Upload new lesson video"
                            />
                            <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                <span className="text-sm font-medium text-primary">{videoFileName || 'Upload New Video (Optional)'}</span>
                                <span className="text-xs text-muted-foreground">Max 500MB</span>
                                {videoFileName && (
                                    <p className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <FileText size={12} /> {videoFileName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Assignment Upload */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">Update Assignment/Resources (Optional)</label>
                        <p className="text-xs text-muted-foreground mb-1">Current: {lessonData.lesson_assignment_url ? <a href={lessonData.lesson_assignment_url} target="_blank" rel="noreferrer" className="text-primary underline">View Resources</a> : 'None'}</p>
                        <div className="relative border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors hover:border-muted-foreground">
                            <input id="update_lesson_assignment" type="file" accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png" name="lesson_assignment"
                                onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={loading} aria-label="Upload new lesson assignment or resources"
                            />
                            <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                <span className="text-sm font-medium text-primary">{assignmentFileName || 'Upload New File (Optional)'}</span>
                                <span className="text-xs text-muted-foreground">Max 50MB</span>
                                {assignmentFileName && (
                                    <p className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <FileText size={12} /> {assignmentFileName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button type="button" variant="outline" onClick={closeModalFunc} disabled={loading} className="mr-2">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="md" isLoading={loading} disabled={loading}>
                            Update Lesson
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateLessonModal;