// src/components/course/AboutInstructor.jsx
// Updated to use correct image field and fallback
import React from 'react';
import PlaceholderAvatar from '../../assets/svgs/placeholder-image.svg'; // Ensure this is a suitable default avatar

const AboutInstructor = ({ creator }) => {
    if (!creator) {
        return null;
    }

    // Use profile_image_original_url from backend (thumbnail field removed)
    const profileImageUrl = creator.profile_image_original_url || PlaceholderAvatar;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid Date';
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-xl font-semibold mb-4 text-foreground">About the Instructor</h2>
            <div className="card p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="order-1 md:order-1 flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28">
                    <img
                        src={profileImageUrl} // Use updated variable
                        alt={`${creator.name ?? 'Instructor'}'s profile`}
                        className="w-full h-full rounded-full object-cover border-2 border-border shadow-md bg-muted"
                        onError={(e) => { e.target.onerror = null; e.target.src = PlaceholderAvatar; }}
                        loading="lazy"
                    />
                </div>
                <div className="flex-1 order-2 md:order-2 text-center md:text-left">
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">{creator.name ?? 'Instructor Name'}</h3>
                    {/* Optional: Add tagline/bio if backend provides them */}
                    {/* <p className="text-sm text-primary/80 mb-3">{creator.tagline || 'Educator'}</p> */}
                    {/* <hr className="border-border my-3 md:hidden" /> */}
                    {/* {creator.bio && <p className="text-sm text-muted-foreground leading-relaxed mb-3">{creator.bio}</p>} */}
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {creator.email && <InfoItem label="Email" value={creator.email} isEmail={true} />}
                        {creator.date_of_joining && <InfoItem label="Member Since" value={formatDate(creator.date_of_joining)} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for info items
const InfoItem = ({ label, value, isEmail = false }) => (
    <p>
        <span className="font-medium text-foreground/80 w-24 inline-block">{label}:</span>
        {isEmail ? (
            <a href={`mailto:${value}`} className="hover:text-primary hover:underline break-all">{value}</a>
        ) : (
            <span className="break-words">{value || 'N/A'}</span>
        )}
    </p>
);

export default AboutInstructor;