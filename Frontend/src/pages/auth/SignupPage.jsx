import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Image as ImageIcon } from "lucide-react";
import { signupUser } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import AuthFormWrapper from "../../components/auth/AuthFormWrapper";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

const SignupPage = () => {
    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { success: showSuccessToast, error: showErrorToast } = useToast();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 2 * 1024 * 1024) {
                showErrorToast("Profile image size cannot exceed 2MB.");
                setProfileImage(null); setImagePreview(null); e.target.value = ''; return;
            }
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setProfileImage(null); setImagePreview(null);
            if (file) showErrorToast("Please select a valid image file (PNG, JPG, etc.).");
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) { showErrorToast("Passwords do not match."); return; }
        if (formData.password.length < 6) { showErrorToast("Password must be at least 6 characters long."); return; }
        setLoading(true);

        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('email', formData.email);
        submissionData.append('password', formData.password);
        if (profileImage) {
            submissionData.append('profile_image', profileImage);
        }

        try {
            await signupUser(submissionData);
            showSuccessToast("Signup successful! Please sign in.");
            setTimeout(() => navigate("/signin"), 1500);
        } catch (error) {
            console.error("Signup error:", error);
            showErrorToast(error.message || "Signup failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <AuthFormWrapper>
            <form onSubmit={handleFormSubmit} className="w-full space-y-5" encType="multipart/form-data">
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-semibold text-foreground">Create Your Account</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Already have an account?{" "}
                        <Button type="button" variant="link" className="p-0 h-auto font-medium" onClick={() => navigate("/signin")} disabled={loading}>Sign in</Button>
                    </p>
                </div>
                <Input id="name" name="name" type="text" label="Full Name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} icon={UserIcon} required disabled={loading} autoComplete="name" />
                <Input id="email" name="email" type="email" label="Email Address" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} icon={Mail} required disabled={loading} autoComplete="email" />
                <div className="space-y-1">
                    <label htmlFor="profile_image_input" className="block text-sm font-medium text-foreground">Profile Picture (Optional)</label>
                    <div className="flex items-center gap-4">
                        {imagePreview ? (<img src={imagePreview} alt="Profile preview" className="w-12 h-12 rounded-full object-cover border border-border" />) :
                            (<div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"><ImageIcon size={20} /></div>)}
                        <Input id="profile_image_input" name="profile_image_input" type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageChange} disabled={loading}
                            className="input !p-0 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Max 2MB (PNG, JPG, GIF, WEBP).</p>
                </div>
                <Input id="password" name="password" type="password" label="Password" placeholder="Create a strong password (min 6 chars)" value={formData.password} onChange={handleInputChange} icon={Lock} showPasswordToggle={true} required disabled={loading} autoComplete="new-password" />
                <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleInputChange} icon={Lock} showPasswordToggle={true} required disabled={loading} autoComplete="new-password" />
                <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={loading} disabled={loading}>Sign up</Button>
            </form>
        </AuthFormWrapper>
    );
};

export default SignupPage;