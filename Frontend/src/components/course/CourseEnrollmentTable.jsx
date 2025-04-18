import React from 'react';
import { Link } from 'react-router-dom';
import { StarRatingDisplay } from './StarRating';
import { UserCircle } from 'lucide-react';

const CourseEnrollmentTable = ({ enrollmentData }) => {

    if (!enrollmentData || !Array.isArray(enrollmentData.enrollments)) {
        const message = enrollmentData?.message || "No enrollment data available or data is invalid.";
        return <p className="text-muted-foreground text-center py-4">{message}</p>;
    }

    const {
        total_enrolled_users = 0,
        average_course_rating = 0,
        total_income = 0,
        enrollments = []
    } = enrollmentData;

    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null || seconds < 0) return 'N/A';
        if (seconds === 0) return '0s';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.round(seconds % 60);
        let timeString = '';
        if (hrs > 0) timeString += `${hrs}h `;
        if (mins > 0) timeString += `${mins}m `;
        if (secs > 0 || timeString === '') timeString += `${secs}s`;
        return timeString.trim();
    };

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 text-center border border-border">
                    <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Total Users</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{total_enrolled_users}</p>
                </div>
                <div className="card p-4 text-center border border-border">
                    <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Average Rating</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-2xl font-bold text-foreground">{average_course_rating > 0 ? average_course_rating.toFixed(1) : '-'}</span>
                        {average_course_rating > 0 && <StarRatingDisplay rating={average_course_rating} size="sm" className="mt-1" />}
                    </div>
                </div>
                <div className="card p-4 text-center border border-border">
                    <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Total Income</p>
                    <p className="text-2xl font-bold text-foreground mt-1">₹{total_income.toFixed(2)}</p>
                </div>
            </div>

            <div className="card overflow-hidden border border-border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Time Spent</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Review Comment</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {enrollments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-4 text-center text-sm text-muted-foreground">No users enrolled yet.</td>
                                </tr>
                            ) : (
                                enrollments.map((enrollment) => (
                                    <tr key={enrollment.user_id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Link
                                                to={`/author/${enrollment.user_id}`}
                                                className="text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded" // Link styling
                                            >
                                                {enrollment.name || 'Unknown User'}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">{enrollment.email}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                            {enrollment.progress_percentage !== undefined ? `${enrollment.progress_percentage}%` : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                                            {formatTime(enrollment.time_spent_seconds)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {enrollment.rating ? (
                                                <StarRatingDisplay rating={enrollment.rating} size="sm" />
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No rating</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate" title={enrollment.review_comment || ''}>
                                            {enrollment.review_comment || <span className="italic text-xs">No comment</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CourseEnrollmentTable;