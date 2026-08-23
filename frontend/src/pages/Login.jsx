import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
  
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {

      const response = await api.post(
        "/api/accounts/login/",
        {
          email,
          password,
        }
      );

      // Store JWT Tokens
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      // Store User Details
      localStorage.setItem("email", response.data.user.email);
      localStorage.setItem("role", response.data.user.role);

      // Navigate based on Role
      if (response.data.user.role === "ADMIN") {
        navigate("/admin/dashboard");
      }
      else if (response.data.user.role === "STUDENT") {
        navigate("/student-dashboard");
      }
      else if (response.data.user.role === "FACULTY") {
        navigate("/faculty-dashboard");
      }

    } catch (error) {

      if (error.response) {
        setErrorMessage(
            error.response.data.message || "Login failed."
        );
      } else {
        setErrorMessage("Server is not responding.");
      }

    }
  };

  return (
    <div className="login-container">

      {/* Logo */}
      <div className="logo">
        <div className="brand-badge">SA</div>

        <div>
          <h2>Smart Attendance System</h2>
        </div>
      </div>

      {/* Decorative Circles */}
      <div className="circle top-right"></div>
      <div className="circle bottom-left"></div>

      <div className="login-card">

        <div className="user-icon">
          👥
        </div>

        <h1 className="welcome">
          Welcome !
        </h1>

        <p className="subtitle">
          Log in to your Smart Attendance account
        </p>

        <form className="login-form" onSubmit={handleLogin}>

          {/* Email */}
          <div className="input-group">

            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>

          {/* Password */}
          <div className="input-group">

            <label htmlFor="password">Password</label>

            <div className="password-container">

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <span
                className="password-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>

            </div>
            {errorMessage && (
              <p className="error-message">
                {errorMessage}
              </p>
            )}

        </div>

          <div className="forgot-password">
            Forgot your password?
          </div>

          <button
            type="submit"
            className="login-btn"
          >
            Log In
          </button>

        </form>

      </div>

      <footer>
        © 2026 Smart Attendance System
      </footer>

    </div>
  );
}

export default Login;
