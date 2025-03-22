"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  // Submits the user's email to request a password reset link
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch(`${BACKEND_URL}users/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      // If the request is successful displays a success msg
      if (response.ok) {
        const data = await response.json();
        setStatusMessage(
          data.message || "If that email is recognized, a reset link will be sent."
        );
      } else {
        const data = await response.json();
        setError(data.error || "Could not request a password reset.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error: could not request a password reset.");
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a
          href="#"
          className="flex items-center mb-6 text-2xl font-bold text-gray-900 dark:text-white"
        >
          ALACRITY
        </a>
        <div className="w-full p-6 bg-white rounded-lg shadow dark:border sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8">
          <h2 className="mb-1 text-xl font-semibold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Forgot Password
          </h2>
          {statusMessage && (
            <p className="text-green-600 mb-2">{statusMessage}</p>
          )}
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <form
            className="mt-4 space-y-4 lg:mt-5 md:space-y-5"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Enter your email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                           focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                           dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
                           dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
