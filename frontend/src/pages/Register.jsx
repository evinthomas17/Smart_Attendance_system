import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
} from "react-icons/fi";
import "./Register.css";

const initialForm = {
  firstName: "",
  lastName: "",
  studentId: "",
  email: "",
  department: "",
  semester: "",
  phone: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

const departments = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];
const semesters = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

function Register() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => {
    const value = form.password;
    let score = 0;

    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score <= 1) {
      return { label: "Very Weak", color: "#ff5b5b" };
    }
    if (score === 2) {
      return { label: "Weak", color: "#ff8f2b" };
    }
    if (score === 3) {
      return { label: "Good", color: "#2c22df" };
    }
    return { label: "Strong", color: "#22c55e" };
  }, [form.password]);

  const validateField = (name, value, currentForm) => {
    switch (name) {
      case "firstName":
      case "lastName":
        return value.trim() ? "" : `${name === "firstName" ? "First" : "Last"} name is required.`;
      case "studentId":
        return value.trim() ? "" : "Student ID is required.";
      case "email":
        return /.+@.+\..+/.test(value) ? "" : "Please enter a valid college email.";
      case "department":
        return value ? "" : "Please select your department.";
      case "semester":
        return value ? "" : "Please select your semester.";
      case "phone":
        return /^\d{10}$/.test(value) ? "" : "Phone number must be 10 digits.";
      case "password":
        return value.length >= 8 ? "" : "Password must be at least 8 characters.";
      case "confirmPassword":
        return value === currentForm.password ? "" : "Passwords do not match.";
      case "terms":
        return value ? "" : "You must accept the terms and conditions.";
      default:
        return "";
    }
  };

  const validateForm = (currentForm) => {
    const validationErrors = {};
    Object.keys(currentForm).forEach((key) => {
      const value = currentForm[key];
      if (key === "terms") {
        if (!value) validationErrors[key] = "You must accept the terms and conditions.";
      } else if (key === "confirmPassword") {
        if (!value) {
          validationErrors[key] = "Please confirm your password.";
        } else if (value !== currentForm.password) {
          validationErrors[key] = "Passwords do not match.";
        }
      } else if (key === "password") {
        if (!value) {
          validationErrors[key] = "Password is required.";
        } else if (value.length < 8) {
          validationErrors[key] = "Password must be at least 8 characters.";
        }
      } else if (!value || (typeof value === "string" && !value.trim())) {
        validationErrors[key] = `${key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} is required.`;
      }
    });

    return validationErrors;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    const nextForm = { ...form, [name]: nextValue };
    setForm(nextForm);

    setStatus({ type: "", message: "" });

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValue, nextForm),
      }));
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, form[name], form),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setTouched({
      firstName: true,
      lastName: true,
      studentId: true,
      email: true,
      department: true,
      semester: true,
      phone: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      setStatus({ type: "error", message: "Please fix the highlighted fields before continuing." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus({ type: "success", message: "Account created successfully. You can now sign in to continue." });
      setIsSubmitting(false);
      setForm(initialForm);
      setTouched({});
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch {
      setIsSubmitting(false);
      setStatus({ type: "error", message: "We could not create your account right now. Please try again." });
    }
  };

  return (
    <div className="register-container">
      <div className="logo">
        <div className="brand-badge">SA</div>
        <div>
          <h2>Smart Attendance System</h2>
        </div>
      </div>

      <div className="circle top-right"></div>
      <div className="circle bottom-left"></div>

      <div className="register-card">
        <div className="register-hero">
          <div className="user-icon">
            <FiUser />
          </div>
          <div>
            <h1 className="welcome">Create Student Account</h1>
            <p className="subtitle">Register with your academic details to access attendance and performance tracking.</p>
          </div>
        </div>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {status.message ? (
            <div className={`status-message ${status.type}`} role="status" aria-live="polite">
              {status.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{status.message}</span>
            </div>
          ) : null}

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="firstName">
                First Name <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <FiUser />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={form.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.firstName)}
                />
              </div>
              {touched.firstName && errors.firstName ? <p className="helper-text error">{errors.firstName}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="lastName">
                Last Name <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <FiUser />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={form.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.lastName)}
                />
              </div>
              {touched.lastName && errors.lastName ? <p className="helper-text error">{errors.lastName}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="studentId">
                Student ID / Register Number <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <FiShield />
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  placeholder="e.g. 2024101001"
                  value={form.studentId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.studentId)}
                />
              </div>
              {touched.studentId && errors.studentId ? <p className="helper-text error">{errors.studentId}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="email">
                College Email <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <FiMail />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="student@college.edu"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {touched.email && errors.email ? <p className="helper-text error">{errors.email}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="department">
                Department <span className="required-star">*</span>
              </label>
              <div className="input-with-icon select-wrapper">
                <FiBookOpen />
                <select
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.department)}
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              {touched.department && errors.department ? <p className="helper-text error">{errors.department}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="semester">
                Semester <span className="required-star">*</span>
              </label>
              <div className="input-with-icon select-wrapper">
                <FiBookOpen />
                <select
                  id="semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.semester)}
                >
                  <option value="">Select semester</option>
                  {semesters.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>
              {touched.semester && errors.semester ? <p className="helper-text error">{errors.semester}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="phone">
                Phone Number <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <FiPhone />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit phone number"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.phone)}
                />
              </div>
              {touched.phone && errors.phone ? <p className="helper-text error">{errors.phone}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="password">
                Password <span className="required-star">*</span>
              </label>
              <div className="input-with-icon password-wrapper">
                <FiLock />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {form.password ? (
                <div className="strength-bar" aria-label="Password strength">
                  <div className="strength-fill" style={{ width: `${(form.password.length / 12) * 100}%`, backgroundColor: passwordStrength.color }}></div>
                </div>
              ) : null}
              {form.password ? <p className="helper-text strength">Strength: {passwordStrength.label}</p> : null}
              {touched.password && errors.password ? <p className="helper-text error">{errors.password}</p> : null}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required-star">*</span>
              </label>
              <div className="input-with-icon password-wrapper">
                <FiLock />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword ? <p className="helper-text error">{errors.confirmPassword}</p> : null}
            </div>
          </div>

          <div className="checkbox-group">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={form.terms}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <label htmlFor="terms">
              I agree to the Terms & Conditions and Privacy Policy.
            </label>
          </div>
          {touched.terms && errors.terms ? <p className="helper-text error">{errors.terms}</p> : null}

          <button type="submit" className="login-btn register-btn" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>

          <div className="auth-link">
            <span>Already have an account?</span>
            <Link to="/">Sign In</Link>
          </div>
        </form>
      </div>

      <footer>© 2026 Smart Attendance System</footer>
    </div>
  );
}

export default Register;
