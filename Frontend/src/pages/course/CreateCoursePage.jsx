import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCategories, createCourse } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { UploadCloud, FileText } from "lucide-react";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import PageLoader from "../../components/common/PageLoader";
import { useAuthContext } from '../../contexts/AuthContext';

const CreateCoursePage = () => {
    const initialFormState = {
        course_title: "", course_description: "", price: "",
        difficulty_level: "", language: "",
        new_category: "",
        existing_category_id: "",
        category_name: "",
    };
    const [formData, setFormData] = useState(initialFormState);
    const [thumbnailImage, setThumbnailImage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [thumbnailName, setThumbnailName] = useState("");

    const navigate = useNavigate();
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const { isAuthenticated } = useAuthContext();

    useEffect(() => {
        if (!isAuthenticated) {
            showErrorToast("You must be logged in to create a course.");
            navigate('/signin', { state: { from: '/created-course/create-new-course' } });
            return;
        }

        const loadCategories = async () => {
            setLoadingCategories(true);
            try {
                const data = await fetchCategories();
                setCategories(data.categories || []);
            } catch (err) {
                console.error("Failed to load categories", err);
                showErrorToast("Could not load categories.");
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };
        loadCategories();
    }, [isAuthenticated, navigate, showErrorToast]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === 'new_category') {
            setFormData((prev) => ({ ...prev, existing_category_id: "", category_name: value }));
        }
    };

    const handleExistingCategoryChange = (e) => {
        const selectedCategoryId = e.target.value;
        const selectedCategory = categories.find(cat => cat.category_id === parseInt(selectedCategoryId));
        if (selectedCategory) {
            setFormData((prev) => ({
                ...prev,
                existing_category_id: selectedCategoryId,
                new_category: selectedCategory.category_name,
                category_name: selectedCategory.category_name,
            }));
        } else {
            setFormData((prev) => ({ ...prev, existing_category_id: "" }));
        }
    };

    const handleThumbnailImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            if (file.size > 5 * 1024 * 1024) {
                showErrorToast("Image size cannot exceed 5MB."); e.target.value = '';
                setThumbnailImage(null); setThumbnailName(""); setThumbnailPreview(null); return;
            }
            setThumbnailImage(file); setThumbnailName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => setThumbnailPreview(reader.result); reader.readAsDataURL(file);
        } else {
            setThumbnailImage(null); setThumbnailName(""); setThumbnailPreview(null);
            if (file) showErrorToast("Please select a valid image file (PNG, JPG, WEBP).");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingSubmit(true);

        if (!thumbnailImage) { showErrorToast("Please upload a course thumbnail."); setLoadingSubmit(false); return; }
        if (!formData.category_name.trim()) {
            showErrorToast("Please select or enter a course category."); setLoadingSubmit(false); return;
        }

        const formPayload = new FormData();
        formPayload.append("course_title", formData.course_title);
        formPayload.append("course_description", formData.course_description);
        formPayload.append("price", formData.price);
        formPayload.append("difficulty_level", formData.difficulty_level);
        formPayload.append("language", formData.language);
        formPayload.append("category_name", formData.category_name.trim());
        formPayload.append("thumbnail_image", thumbnailImage);

        try {
            const result = await createCourse(formPayload);
            showSuccessToast("Course created successfully! Redirecting...");
            setTimeout(() => navigate(`/created-course/${result.course.course_id}`), 1500);
        } catch (error) {
            console.error("Error creating course:", error);
            showErrorToast(error.message || "Error creating course.");
            setLoadingSubmit(false);
        }
    };

    if (!isAuthenticated || loadingCategories) {
        return <PageLoader message={!isAuthenticated ? "Verifying..." : "Loading data..."} />;
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Create New Course</h1>
                <p className="text-muted-foreground text-sm">Fill in the details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                <Input id="course_title" label="Course Title *" name="course_title" value={formData.course_title} onChange={handleInputChange} required disabled={loadingSubmit} />
                <div className="space-y-1">
                    <label htmlFor="thumbnail_image_input" className="block text-sm font-medium text-foreground">Course Thumbnail *</label>
                    <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${thumbnailPreview ? 'border-primary/50' : 'border-border hover:border-muted-foreground'}`}>
                        <input id="thumbnail_image_input" type="file" accept="image/*" name="thumbnail_image_input" onChange={handleThumbnailImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={loadingSubmit} required />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                            {thumbnailPreview ? <img src={thumbnailPreview} alt="Preview" className="max-h-32 rounded border" /> : <UploadCloud className="h-10 w-10 text-muted-foreground" />}
                            <span>{thumbnailName || 'Click or Drag Image'}</span> <span className="text-xs text-muted-foreground">(Max 5MB)</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-1">
                    <label htmlFor="course_description" className="block text-sm font-medium text-foreground">Description *</label>
                    <textarea id="course_description" name="course_description" value={formData.course_description} onChange={handleInputChange} className="textarea" rows="5" required disabled={loadingSubmit} />
                </div>
                <Input id="price" label="Price (INR ₹) *" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleInputChange} required disabled={loadingSubmit} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label htmlFor="difficulty_level" className="block text-sm font-medium text-foreground">Difficulty *</label>
                        <select id="difficulty_level" name="difficulty_level" value={formData.difficulty_level} onChange={handleInputChange} className="input w-full" required disabled={loadingSubmit}>
                            <option value="" disabled>Select...</option>
                            {["Beginner", "Intermediate", "Advanced", "All Levels"].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="language" className="block text-sm font-medium text-foreground">Language *</label>
                        <select id="language" name="language" value={formData.language} onChange={handleInputChange} className="input w-full" required disabled={loadingSubmit}>
                            <option value="" disabled>Select...</option>
                            {["English", "Hindi", "Spanish", "French", "German", "Other"].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-4 card p-4 border border-border">
                    <label className="block text-sm font-medium text-foreground">Course Category *</label>
                    <div className="space-y-2">
                        <Input
                            id="new_category" label="Enter New Category Name" name="new_category"
                            value={formData.new_category} onChange={handleInputChange}
                            placeholder="Or type a new one here..." disabled={loadingSubmit}
                        />
                        <p className="text-center text-xs text-muted-foreground my-1">OR</p>
                        <div className="space-y-1">
                            <label htmlFor="existing_category_id" className="block text-sm font-medium text-foreground">Select Existing Category</label>
                            <select
                                id="existing_category_id" name="existing_category_id"
                                value={formData.existing_category_id}
                                onChange={handleExistingCategoryChange} // Use specific handler
                                className="input w-full" disabled={loadingSubmit || loadingCategories}
                            >
                                <option value="" disabled={!formData.new_category.trim()}>-- Select from list --</option>
                                {categories.map((cat) => (
                                    <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Final category to be used: <strong>{formData.category_name || '(Please select or enter)'}</strong>
                    </p>
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" size="lg" isLoading={loadingSubmit} disabled={loadingSubmit || loadingCategories}>
                        Create Course
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateCoursePage;