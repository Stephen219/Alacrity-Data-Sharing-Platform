"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BACKEND_URL } from "@/config";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const uidb64 = searchParams.get("uidb64");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [resetSuccessful, setResetSuccessful] = useState(false);

// Checks if the reset link is missing required parameters
  useEffect(() => {
    if (!uidb64 || !token) {
      setError("Invalid password reset link. Missing query params.");
    }
  }, [uidb64, token]);

  // Handles form submission and password reset
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    // Ensures both passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Regex-based password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters, contain uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    // Checks for valid URL parameters
    if (!uidb64 || !token) {
      setError("No token or uid provided.");
      return;
    }

    // Sends post request to backend with new password
    try {
      const response = await fetch(`${BACKEND_URL}/users/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "include",
        body: JSON.stringify({ uidb64, token, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatusMessage(data.message || "Password reset successful. You may now log in.");
        setResetSuccessful(true);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred.");
    }
  };

  // If password reset is complete, show a success message
  if (resetSuccessful) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow dark:border sm:p-8 dark:bg-gray-800 dark:border-gray-700">
          <h1 className="mb-1 text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
            Password Reset Complete
          </h1>
          <p className="text-green-600 mb-4">{statusMessage}</p>
          <p>
            Your password has been successfully reset. Please{" "}
            <a href="/auth/sign-in" className="text-primary hover:text-orange-700">
              sign in
            </a>{" "}
            with your new password.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a href="#" className="flex items-center mb-6 text-2xl font-bold text-gray-900 dark:text-white ">
          ALACRITY
        </a>
        <div className="w-full p-6 bg-white rounded-lg shadow dark:border sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8">
          <h2 className="mb-1 text-xl font-semibold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Change Password
          </h2>
          {statusMessage && <p className="text-green-600 mb-2">{statusMessage}</p>}
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <form className="mt-4 space-y-4 lg:mt-5 md:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                New Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirm-password"
                id="confirm-password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="newsletter"
                  aria-describedby="newsletter"
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="newsletter" className="font-light text-gray-500 dark:text-gray-300">
                  I accept the{" "}
                  <a className="font-medium text-primary-600 hover:underline dark:text-primary-500" href="#">
                    Terms and Conditions
                  </a>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full text-white bg-primary hover:bg-orange-400 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
