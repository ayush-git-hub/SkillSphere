import React, { useState } from "react";
import { addLesson } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { UploadCloud, FileText, X as CloseIcon } from "lucide-react";
import Input from "../common/Input";
import Button from "../common/Button";

const AddLessonModal = ({ courseId, closeModalFunc, onLessonAdded }) => {
    const initialLessonState = {
        lesson_title: "",
        lesson_description: "",
    };
    const [lessonData, setLessonData] = useState(initialLessonState);
    const [lessonVideo, setLessonVideo] = useState(null);
    const [lessonAssignment, setLessonAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [videoFileName, setVideoFileName] = useState("");
    const [assignmentFileName, setAssignmentFileName] = useState("");
    const { error: showErrorToast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLessonData({ ...lessonData, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        const maxSizeVideo = 500 * 1024 * 1024;
        const maxSizeAssignment = 50 * 1024 * 1024;

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
            if (name === 'lesson_video') { setLessonVideo(null); setVideoFileName(""); }
            if (name === 'lesson_assignment') { setLessonAssignment(null); setAssignmentFileName(""); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!lessonData.lesson_title) {
            showErrorToast("Lesson title is required."); setLoading(false); return;
        }

        const formData = new FormData();
        formData.append("lesson_title", lessonData.lesson_title);
        formData.append("lesson_description", lessonData.lesson_description || "");

        if (lessonVideo) formData.append("lesson_video", lessonVideo);
        if (lessonAssignment) formData.append("lesson_assignment", lessonAssignment);

        try {
            await addLesson(courseId, formData);
            onLessonAdded();
            closeModalFunc();

        } catch (error) {
            console.error("Add lesson error:", error);
            showErrorToast(error.message || "Failed to add lesson. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4"
            onClick={closeModalFunc} role="dialog" aria-modal="true" aria-labelledby="add-lesson-title"
        >
            <div
                className="card w-full max-w-lg relative p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <Button
                    variant="ghost" size="icon" onClick={closeModalFunc}
                    className="absolute top-3 right-3 h-8 w-8" aria-label="Close add lesson modal"
                >
                    <CloseIcon size={20} />
                </Button>
                <h2 id="add-lesson-title" className="text-xl sm:text-2xl font-semibold mb-6 text-center text-card-foreground">Add New Lesson</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="add_lesson_title_modal" label="Lesson Title" name="lesson_title"
                        value={lessonData.lesson_title} onChange={handleChange}
                        placeholder="e.g., Introduction to Components" required disabled={loading}
                    />

                    <div className="space-y-1">
                        <label htmlFor="add_lesson_description_modal" className="block text-sm font-medium text-foreground">Lesson Description (Optional)</label>
                        <textarea id="add_lesson_description_modal" name="lesson_description" value={lessonData.lesson_description}
                            onChange={handleChange} rows={4} className="textarea"
                            placeholder="Briefly describe this lesson..." disabled={loading}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">Upload Lesson Video (Optional)</label>
                        <div className="relative border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors hover:border-muted-foreground">
                            <input id="add_lesson_video_modal" type="file" accept="video/mp4,video/webm,video/ogg" name="lesson_video"
                                onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={loading} aria-label="Upload lesson video"
                            />
                            <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                <span className="text-sm font-medium text-primary">{videoFileName || 'Click or Drag Video'}</span>
                                <span className="text-xs text-muted-foreground">MP4, WEBM, OGG (Max 500MB)</span>
                                {videoFileName && (
                                    <p className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <FileText size={12} /> {videoFileName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">Upload Assignment/Resources (Optional)</label>
                        <div className="relative border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors hover:border-muted-foreground">
                            <input id="add_lesson_assignment_modal" type="file" accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png" name="lesson_assignment"
                                onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={loading} aria-label="Upload lesson assignment or resources"
                            />
                            <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                <span className="text-sm font-medium text-primary">{assignmentFileName || 'Click or Drag File'}</span>
                                <span className="text-xs text-muted-foreground">PDF, DOCX, ZIP, etc. (Max 50MB)</span>
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
                            Add Lesson
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLessonModal;