/**
 * @fileoverview Add Contributor Page
 * 
 * This file contains the AddContributorForm component, which provides a form for adding new contributors to an organization.
 * The form collects the contributor's first name, last name, email, phone number, and role.
 * It handles form submission, including validation and error handling, and sends the data to the backend server.
 * Upon successful submission, the user is redirected to the dashboard.
 * 
 * The component uses React hooks for state management and Next.js router for navigation.
 * It also includes loading and success states to provide feedback to the user during the form submission process.
 */
/**
 * @fileoverview Add contributor page
 * 
 */

"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";

const AddContributorForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: "",
    sur_name: "",
    email: "",
    phone_number: "",
    role: "contributor",
  });
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [surNameError, setSurNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for the field being edited
    switch (name) {
      case "first_name":
        setFirstNameError(null);
        break;
      case "sur_name":
        setSurNameError(null);
        break;
      case "email":
        setEmailError(null);
        break;
      case "phone_number":
        setPhoneNumberError(null);
        break;
      case "role":
        setRoleError(null);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFirstNameError(null);
    setSurNameError(null);
    setEmailError(null);
    setPhoneNumberError(null);
    setRoleError(null);
    setGeneralError(null);

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/organisation/add_contributor/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Server response:", data);

        // Handle field-specific errors
        if (data.first_name) setFirstNameError(data.first_name[0]);
        if (data.sur_name) setSurNameError(data.sur_name[0]);
        if (data.email) setEmailError(data.email[0]);
        if (data.phone_number) setPhoneNumberError(data.phone_number[0]);
        if (data.role) setRoleError(data.role[0]);

        // Handle general error if no field-specific errors
        if (data.error || Object.keys(data).length === 0) {
          setGeneralError(data.error || "An unexpected server error occurred");
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Network or fetch error:", err);
      setGeneralError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Add New Contributor</h1>
        <p className="text-gray-600 dark:text-gray-400">Invite a team member to collaborate on your organization</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 sm:p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-green-600 dark:text-green-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Contributor Added Successfully!</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">Redirecting you to the dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                    placeholder="Enter first name"
                  />
                  {firstNameError && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{firstNameError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="sur_name" className="text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    id="sur_name"
                    name="sur_name"
                    type="text"
                    value={formData.sur_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                    placeholder="Enter last name"
                  />
                  {surNameError && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{surNameError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="colleague@example.com"
                />
                {emailError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone_number" className="text-sm font-medium">
                  Phone Number
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
                {phoneNumberError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{phoneNumberError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors appearance-none"
                >
                  <option value="contributor">Contributor</option>
                  <option value="organization_admin">Organization Admin</option>
                </select>
                {roleError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{roleError}</p>
                )}
              </div>

              {generalError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                  {generalError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg
                      className="mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Add Contributor
                  </div>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddContributorForm;