import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function useLogout() {
  const navigate = useNavigate();

  return async function logout() {
    const shouldLogout = window.confirm("Are you sure you want to logout?");
    if (!shouldLogout) return false;

    const accessToken = localStorage.getItem("access");
    const refreshToken = localStorage.getItem("refresh");

    ["access", "refresh", "email", "role"].forEach((key) => {
      localStorage.removeItem(key);
    });

    navigate("/login", { replace: true });

    if (refreshToken && accessToken) {
      try {
        await axios.post(
          "/api/accounts/logout/",
          { refresh: refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }

    return true;
  };
}

export function useProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return { isOpen, setIsOpen, ref };
}