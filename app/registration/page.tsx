"use client";
import { useState } from "react";

const socialIcons = [
  { label: "Facebook", icon: "fab fa-facebook-f", href: "#" },
  { label: "Google Plus", icon: "fab fa-google-plus-g", href: "#" },
  { label: "LinkedIn", icon: "fab fa-linkedin-in", href: "#" },
];

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export default function RegistrationPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false,
  });

  const validatePassword = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Minimum length
    if (password.length < 8) {
      feedback.push("Password must be at least 8 characters long");
    } else {
      score += 1;
    }

    // Character variety
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase) feedback.push("Include at least one uppercase letter");
    if (!hasLowercase) feedback.push("Include at least one lowercase letter");
    if (!hasNumbers) feedback.push("Include at least one number");
    if (!hasSpecialChars) feedback.push("Include at least one special character");

    const varietyCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
    if (varietyCount >= 3) score += 2;
    else if (varietyCount >= 2) score += 1;

    // Check for common weak passwords
    const weakPasswords = ["123456", "password", "qwerty", "abc123", "password123"];
    if (weakPasswords.includes(password.toLowerCase())) {
      feedback.push("This is a common weak password");
    } else {
      score += 1;
    }

    // Check for sequential characters
    if (/(.)\1{2,}/.test(password) || /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      feedback.push("Avoid repeated or sequential characters");
    } else {
      score += 1;
    }

    return {
      score: Math.min(score, 5),
      feedback,
      isValid: score >= 4 && feedback.length === 0,
    };
  };

  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear previous errors
    setErrors(prev => ({ ...prev, [field]: undefined }));

    // Real-time validation
    if (field === "password") {
      setPasswordStrength(validatePassword(value));
    } else if (field === "email") {
      const emailError = validateEmail(value);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      }
    } else if (field === "confirmPassword" && formData.password) {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    const newErrors: ValidationErrors = {};

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Validate password
    if (isSignUp) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (!passwordStrength.isValid) {
        newErrors.password = "Password does not meet requirements";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      }
    } else {
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Form is valid, proceed with submission
      console.log("Form submitted:", formData);
      // Here you would typically make an API call
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8">
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-3xl min-h-[480px] overflow-hidden transition-all duration-500 ${isSignUp ? "right-panel-active" : ""}`}
        aria-label="Registration container"
      >
        {/* Sign Up Form */}
        <div
          className={`absolute top-0 left-0 h-full w-1/2 z-10 transition-all duration-500 ${isSignUp ? "translate-x-full opacity-100 z-20" : "opacity-0 z-10"}`}
          aria-hidden={!isSignUp}
        >
          <form 
            className="bg-white flex flex-col items-center justify-center h-full px-12 text-center overflow-y-auto" 
            aria-label="Sign up form"
            onSubmit={(e) => handleSubmit(e, true)}
          >
            <h1 className="font-bold text-3xl mb-2">Create Account</h1>
            <div className="flex justify-center gap-2 my-4">
              {socialIcons.map((icon) => (
                <a
                  key={icon.label}
                  href={icon.href}
                  aria-label={icon.label}
                  tabIndex={0}
                  className="border border-gray-200 rounded-full flex items-center justify-center w-10 h-10 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <i className={icon.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
            <span className="text-xs mb-2">or use your email for registration</span>
            
            {/* Name Input */}
            <input
              type="text"
              placeholder="Name"
              aria-label="Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.name ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs text-left w-full">{errors.name}</p>}

            {/* Email Input */}
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.email ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs text-left w-full">{errors.email}</p>}

            {/* Password Input */}
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.password ? 'ring-2 ring-red-400' : ''}`}
            />
            {formData.password && (
              <div className="w-full text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {passwordStrength.score}/5
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="text-xs text-gray-600 mb-2">
                    {passwordStrength.feedback.map((msg, index) => (
                      <p key={index} className="text-red-500">• {msg}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.password && <p className="text-red-500 text-xs text-left w-full">{errors.password}</p>}

            {/* Confirm Password Input */}
            <input
              type="password"
              placeholder="Confirm Password"
              aria-label="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className={`bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.confirmPassword ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs text-left w-full">{errors.confirmPassword}</p>}

            <button
              type="submit"
              className="mt-4 rounded-full border border-pink-600 bg-pink-600 text-white font-bold px-8 py-3 uppercase text-xs tracking-wider transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              Sign Up
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div
          className={`absolute top-0 left-0 h-full w-1/2 z-20 transition-all duration-500 ${isSignUp ? "-translate-x-full opacity-0 z-10" : "opacity-100 z-20"}`}
          aria-hidden={isSignUp}
        >
          <form 
            className="bg-white flex flex-col items-center justify-center h-full px-12 text-center" 
            aria-label="Sign in form"
            onSubmit={(e) => handleSubmit(e, false)}
          >
            <h1 className="font-bold text-3xl mb-2">Sign in</h1>
            <div className="flex justify-center gap-2 my-4">
              {socialIcons.map((icon) => (
                <a
                  key={icon.label}
                  href={icon.href}
                  aria-label={icon.label}
                  tabIndex={0}
                  className="border border-gray-200 rounded-full flex items-center justify-center w-10 h-10 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <i className={icon.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
            <span className="text-xs mb-2">or use your account</span>
            
            {/* Email Input */}
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.email ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs text-left w-full">{errors.email}</p>}

            {/* Password Input */}
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`bg-gray-100 border-none rounded px-4 py-3 my-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.password ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.password && <p className="text-red-500 text-xs text-left w-full">{errors.password}</p>}

            <a
              href="/reset-password"
              className="text-gray-500 text-xs mt-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400"
              tabIndex={0}
              aria-label="Forgot your password?"
            >
              Forgot your password?
            </a>
            <button
              type="submit"
              className="mt-4 rounded-full border border-pink-600 bg-pink-600 text-white font-bold px-8 py-3 uppercase text-xs tracking-wider transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Overlay */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 transition-transform duration-500 ${isSignUp ? "-translate-x-full" : "translate-x-0"}`}
          aria-hidden="true"
        >
          <div className="bg-gradient-to-r from-pink-600 to-pink-400 text-white absolute left-[-100%] h-full w-[200%] flex transition-transform duration-500" style={{ transform: isSignUp ? "translateX(50%)" : "translateX(0)" }}>
            {/* Overlay Left */}
            <div className={`flex flex-col items-center justify-center px-10 text-center h-full w-1/2 transition-transform duration-500 ${isSignUp ? "translate-x-0" : "-translate-x-1/5"}`}>
              <h1 className="font-bold text-3xl mb-2">Welcome Back!</h1>
              <p className="text-sm font-light mb-6">To keep connected with us please login with your personal info</p>
              <button
                className="ghost border border-white bg-transparent text-white font-bold px-8 py-3 rounded-full uppercase text-xs tracking-wider mt-2 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setIsSignUp(false)}
                tabIndex={0}
                aria-label="Sign In"
                type="button"
              >
                Sign In
              </button>
            </div>
            {/* Overlay Right */}
            <div className={`flex flex-col items-center justify-center px-10 text-center h-full w-1/2 transition-transform duration-500 ${isSignUp ? "translate-x-1/5" : "translate-x-0"}`}>
              <h1 className="font-bold text-3xl mb-2">Hello, Friend!</h1>
              <p className="text-sm font-light mb-6">Enter your personal details and start journey with us</p>
              <button
                className="ghost border border-white bg-transparent text-white font-bold px-8 py-3 rounded-full uppercase text-xs tracking-wider mt-2 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setIsSignUp(true)}
                tabIndex={0}
                aria-label="Sign Up"
                type="button"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </main>
  );
} 