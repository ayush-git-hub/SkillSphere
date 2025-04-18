import React, { useState, useEffect } from "react";
import { Mail, User as UserIcon, Lock, X as CloseIcon, Image as ImageIcon } from "lucide-react";
import { updateUserDetails } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import Input from "../common/Input";
import Button from "../common/Button";
import PlaceholderAvatar from '../../assets/svgs/placeholder-image.svg';
import { useAuthContext } from "../../contexts/AuthContext";

const UpdateDetailsModal = ({ closeModalFunc, currentUser }) => {
    const { updateUserState } = useAuthContext();
    const [name, setName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const { success: showSuccessToast, error: showErrorToast } = useToast();

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || "");
            setImagePreview(currentUser.profile_image_original_url || null);
            setProfileImageFile(null);
            setNewPassword("");
            setConfirmPassword("");
        }
    }, [currentUser]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 2 * 1024 * 1024) {
                showErrorToast("Profile image size cannot exceed 2MB.");
                setProfileImageFile(null);
                setImagePreview(currentUser.profile_image_original_url || null);
                e.target.value = '';
                return;
            }
            setProfileImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setProfileImageFile(null);
            setImagePreview(currentUser.profile_image_original_url || null);
            if (file) {
                showErrorToast("Please select a valid image file (PNG, JPG, etc.).");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!currentUser || !currentUser.user_id) {
            showErrorToast("User information is missing."); setLoading(false); return;
        }
        const formData = new FormData();
        let hasChanges = false;
        const trimmedName = name.trim();
        if (!trimmedName) { showErrorToast("Name cannot be empty."); setLoading(false); return; }
        if (trimmedName !== currentUser.name) {
            formData.append('name', trimmedName); hasChanges = true;
        }
        const trimmedNewPassword = newPassword.trim();
        const trimmedConfirmPassword = confirmPassword.trim();
        if (trimmedNewPassword) {
            if (trimmedNewPassword.length < 6) { showErrorToast("New password must be at least 6 characters."); setLoading(false); return; }
            if (trimmedNewPassword !== trimmedConfirmPassword) { showErrorToast("New passwords do not match."); setLoading(false); return; }
            formData.append('password', trimmedNewPassword); hasChanges = true;
        } else if (trimmedConfirmPassword && !trimmedNewPassword) {
            showErrorToast("Please enter the new password first."); setLoading(false); return;
        }
        if (profileImageFile) {
            formData.append('profile_image', profileImageFile); hasChanges = true;
        }
        if (!hasChanges) { showErrorToast("No changes detected."); setLoading(false); return; }
        try {
            const responseData = await updateUserDetails(formData);
            showSuccessToast("Profile updated successfully!");
            if (updateUserState && responseData.user) {
                updateUserState(responseData.user);
            } else { console.warn("Update success callback issue:", responseData); }
            closeModalFunc();
        } catch (error) {
            console.error("Update details error:", error);
            showErrorToast(error.message || "Update failed.");
        } finally { setLoading(false); }
    };

    if (!currentUser) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={closeModalFunc} role="dialog" aria-modal="true" aria-labelledby="update-profile-title">
            <div className="card w-full max-w-md relative p-6 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={closeModalFunc} className="absolute top-3 right-3 h-8 w-8" aria-label="Close"><CloseIcon size={20} /></Button>
                <h2 id="update-profile-title" className="text-xl sm:text-2xl font-semibold mb-6 text-center">Update Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
                    <div className="space-y-1">
                        <label htmlFor="profile_image_update_input" className="block text-sm font-medium text-foreground">Profile Picture (Optional)</label>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full flex-shrink-0 bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img
                                        key={imagePreview}
                                        src={imagePreview}
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderAvatar; }}
                                    />
                                ) : (
                                    <ImageIcon className="w-7 h-7 text-muted-foreground" />
                                )}
                            </div>

                            <Input
                                id="profile_image_update_input"
                                name="profile_image_update_input"
                                type="file"
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                onChange={handleImageChange}
                                disabled={loading}
                                className="input !p-0 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Max 2MB.</p>
                    </div>

                    <Input id="update-name" label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} icon={UserIcon} required disabled={loading} />
                    <Input id="update-email" label="Email (Read-only)" name="email" value={currentUser.email || ""} icon={Mail} readOnly disabled className="cursor-not-allowed bg-muted/50" />
                    <Input id="update-password" label="New Password" name="newPassword" type="password" placeholder="Leave blank to keep current" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={Lock} showPasswordToggle={true} disabled={loading} autoComplete="new-password" />
                    <Input id="confirm-password" label="Confirm New Password" name="confirmPassword" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={Lock} showPasswordToggle={true} disabled={loading || !newPassword} autoComplete="new-password" />
                    <p className="text-xs text-muted-foreground -mt-3 pl-1">Enter a new password only if you want to change it.</p>
                    <Button type="submit" variant="primary" size="md" className="w-full mt-3" isLoading={loading} disabled={loading}> Save Changes </Button>
                </form>
            </div>
        </div>
    );
};

export default UpdateDetailsModal;