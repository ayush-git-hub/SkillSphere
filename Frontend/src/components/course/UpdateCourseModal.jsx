// FRONTEND/src/components/course/UpdateCourseModal.jsx
// Updated: Dual Category Input
import React, { useState, useEffect } from "react";
import { updateCourse, fetchCategories } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { UploadCloud, FileText, X as CloseIcon } from "lucide-react";
import Input from "../common/Input";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";

const UpdateCourseModal = ({ courseData, closeModalFunc, onUpdateSuccess }) => {
    const initialFormState = {
        course_title: "", course_description: "", price: "",
        difficulty_level: "", language: "",
        new_category: "", // Holds typed category name
        existing_category_id: "", // Holds selected ID
        category_name: "", // Final name to submit
    };
    const [formData, setFormData] = useState(initialFormState);
    const [thumbnailImage, setThumbnailImage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [thumbnailName, setThumbnailName] = useState("");

    const { success: showSuccessToast, error: showErrorToast } = useToast();

    useEffect(() => {
        if (courseData) {
            const currentCategoryName = courseData.category_name || "";
            setFormData({
                course_title: courseData.course_title || "",
                course_description: courseData.course_description || "",
                price: courseData.price !== null ? String(courseData.price) : "",
                difficulty_level: courseData.difficulty_level || "",
                language: courseData.language || "",
                new_category: currentCategoryName, // Pre-fill text input
                existing_category_id: "", // Reset dropdown selection
                category_name: currentCategoryName, // Set initial final name
            });
            setThumbnailImage(null); setThumbnailName(""); setThumbnailPreview(null);
        }
    }, [courseData]);

    useEffect(() => {
        const loadCategories = async () => {
            setLoadingCategories(true);
            try {
                const data = await fetchCategories();
                setCategories(data.categories || []);
                // After categories load, try to find the current course's category ID
                if (courseData?.category_name && data.categories) {
                    const currentCat = data.categories.find(c => c.category_name === courseData.category_name);
                    if (currentCat) {
                        setFormData(prev => ({ ...prev, existing_category_id: currentCat.category_id.toString() }));
                    }
                }
            } catch (err) {
                showErrorToast("Could not load categories."); setCategories([]);
            } finally { setLoadingCategories(false); }
        };
        loadCategories();
    }, [showErrorToast, courseData?.category_name]); // Reload if course category name changes (unlikely but safe)

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Dual Category: Typing in new_category updates final name and clears selection
        if (name === 'new_category') {
            setFormData((prev) => ({ ...prev, existing_category_id: "", category_name: value }));
        }
    };

    // Dual Category: Handle Dropdown Selection
    const handleExistingCategoryChange = (e) => {
        const selectedCategoryId = e.target.value;
        const selectedCategory = categories.find(cat => cat.category_id === parseInt(selectedCategoryId));
        if (selectedCategory) {
            setFormData((prev) => ({
                ...prev,
                existing_category_id: selectedCategoryId,
                new_category: selectedCategory.category_name, // Autofill text
                category_name: selectedCategory.category_name, // Update final name
            }));
        } else {
            setFormData((prev) => ({ ...prev, existing_category_id: "" }));
        }
    };


    const handleThumbnailImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showErrorToast("Image size cannot exceed 5MB."); e.target.value = '';
                setThumbnailImage(null); setThumbnailName(""); setThumbnailPreview(null); return;
            }
            setThumbnailImage(file); setThumbnailName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => setThumbnailPreview(reader.result); reader.readAsDataURL(file);
        } else {
            setThumbnailImage(null); setThumbnailName(""); setThumbnailPreview(null);
            if (file) showErrorToast("Please select a valid image file.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingSubmit(true);

        if (!formData.category_name.trim()) {
            showErrorToast("Please select or enter a course category."); setLoadingSubmit(false); return;
        }

        const formPayload = new FormData();
        formPayload.append("course_title", formData.course_title);
        formPayload.append("course_description", formData.course_description);
        formPayload.append("price", formData.price);
        formPayload.append("difficulty_level", formData.difficulty_level);
        formPayload.append("language", formData.language);
        formPayload.append("category_name", formData.category_name.trim()); // Submit final name
        if (thumbnailImage) formPayload.append("thumbnail_image", thumbnailImage);

        try {
            await updateCourse(courseData.course_id, formPayload);
            showSuccessToast("Course updated successfully!");
            onUpdateSuccess(); closeModalFunc();
        } catch (error) {
            showErrorToast(error.message || "Error updating course.");
            setLoadingSubmit(false);
        }
    };

    if (!courseData) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={closeModalFunc} role="dialog" aria-modal="true" aria-labelledby="update-course-title">
            <div className="card w-full max-w-2xl relative p-6 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={closeModalFunc} className="absolute top-3 right-3 h-8 w-8" aria-label="Close"> <CloseIcon size={20} /> </Button>
                <h2 id="update-course-title" className="text-xl sm:text-2xl font-semibold mb-6 text-center">Update Course</h2>
                {loadingCategories ? <div className="flex justify-center p-4"><LoadingSpinner /></div> : (
                    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                        {/* Standard Inputs */}
                        <Input id="update_course_title" label="Title *" name="course_title" value={formData.course_title} onChange={handleInputChange} required disabled={loadingSubmit} />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium">Thumbnail (Optional Update)</label>
                            <img src={thumbnailPreview || courseData.thumbnail_url || ''} alt="Thumbnail" className="max-h-24 rounded border mb-2 bg-muted" onError={(e) => e.target.style.display = 'none'} />
                            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${thumbnailPreview ? 'border-primary/50' : 'border-border hover:border-muted-foreground'}`}>
                                <input id="update_thumbnail_image_input" type="file" accept="image/*" name="update_thumbnail_image_input" onChange={handleThumbnailImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={loadingSubmit} />
                                <div className="flex flex-col items-center space-y-2 pointer-events-none">
                                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                    <span>{thumbnailName || 'Click or Drag New Image'}</span> <span className="text-xs text-muted-foreground">(Max 5MB)</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="update_course_description">Description *</label>
                            <textarea id="update_course_description" name="course_description" value={formData.course_description} onChange={handleInputChange} className="textarea" rows="5" required disabled={loadingSubmit} />
                        </div>
                        <Input id="update_price" label="Price (INR ₹) *" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleInputChange} required disabled={loadingSubmit} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label htmlFor="update_difficulty_level">Difficulty *</label>
                                <select id="update_difficulty_level" name="difficulty_level" value={formData.difficulty_level} onChange={handleInputChange} className="input w-full" required disabled={loadingSubmit}>
                                    <option value="" disabled>Select...</option>
                                    {["Beginner", "Intermediate", "Advanced", "All Levels"].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="update_language">Language *</label>
                                <select id="update_language" name="language" value={formData.language} onChange={handleInputChange} className="input w-full" required disabled={loadingSubmit}>
                                    <option value="" disabled>Select...</option>
                                    {["English", "Hindi", "Spanish", "French", "German", "Other"].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Dual Category Input */}
                        <div className="space-y-4 card p-4 border border-border">
                            <label className="block text-sm font-medium text-foreground">Course Category *</label>
                            <div className="space-y-2">
                                <Input id="update_new_category" label="Enter Category Name" name="new_category" value={formData.new_category} onChange={handleInputChange} placeholder="Type new or selected category..." disabled={loadingSubmit} />
                                <p className="text-center text-xs text-muted-foreground my-1">OR</p>
                                <div className="space-y-1">
                                    <label htmlFor="update_existing_category_id">Select Existing Category</label>
                                    <select id="update_existing_category_id" name="existing_category_id" value={formData.existing_category_id} onChange={handleExistingCategoryChange} className="input w-full" disabled={loadingSubmit || loadingCategories}>
                                        <option value="" disabled={!formData.new_category?.trim()}>-- Select from list --</option>
                                        {categories.map((cat) => <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Final category: <strong>{formData.category_name || '(Please select or enter)'}</strong></p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="button" variant="outline" onClick={closeModalFunc} disabled={loadingSubmit} className="mr-2">Cancel</Button>
                            <Button type="submit" variant="primary" size="lg" isLoading={loadingSubmit} disabled={loadingSubmit}> Update Course </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdateCourseModal;