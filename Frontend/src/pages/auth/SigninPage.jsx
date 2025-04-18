


// src/pages/auth/SigninPage.jsx
// No longer needs login prop, uses context
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { signinUser } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { useAuthContext } from "../../contexts/AuthContext"; // Import context hook
import AuthFormWrapper from "../../components/auth/AuthFormWrapper";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

// No longer needs login prop
const SigninPage = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const { login } = useAuthContext(); // Get login function from context

    const from = location.state?.from?.pathname || "/explore";

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const responseData = await signinUser(formData);
            if (responseData.token && responseData.user) {
                login(responseData.token, responseData.user); // Use login from context
                showSuccessToast("Sign in successful! Redirecting...");
                navigate(from, { replace: true });
            } else {
                throw new Error("Invalid response received from server.");
            }
        } catch (error) {
            console.error("Sign in error:", error);
            showErrorToast(error.message || "Sign in failed.");
            setLoading(false);
        }
    };

    return (
        <AuthFormWrapper>
            <form onSubmit={handleFormSubmit} className="w-full space-y-6">
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-semibold text-foreground">Welcome Back!</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Don’t have an account?{" "}
                        <Button type="button" variant="link" className="p-0 h-auto font-medium" onClick={() => navigate("/signup")}> Sign up </Button>
                    </p>
                </div>
                <Input id="email" name="email" type="email" label="Email Address" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} icon={Mail} required disabled={loading} autoComplete="email" />
                <Input id="password" name="password" type="password" label="Password" placeholder="Enter your password" value={formData.password} onChange={handleInputChange} icon={Lock} showPasswordToggle={true} required disabled={loading} autoComplete="current-password" />
                <div className="flex justify-end text-sm">
                    <Button type="button" variant="link" className="p-0 h-auto text-xs" disabled={loading}> Forgot Password? </Button>
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading} disabled={loading}> Sign in </Button>
            </form>
        </AuthFormWrapper>
    );
};

export default SigninPage;