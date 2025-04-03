"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

const AddOrganizationForm: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    field: "", // New field added
    admin: {
      first_name: "",
      sur_name: "",
      email: "",
      phone_number: "",
      password: "",
      password2: "",
    },
  });

  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [orgEmailError, setOrgEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null); // New error state
  const [adminFirstNameError, setAdminFirstNameError] = useState<string | null>(null);
  const [adminSurNameError, setAdminSurNameError] = useState<string | null>(null);
  const [adminEmailError, setAdminEmailError] = useState<string | null>(null);
  const [adminPhoneError, setAdminPhoneError] = useState<string | null>(null);
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("admin.")) {
      const adminField = name.split(".")[1];
      setFormData({
        ...formData,
        admin: { ...formData.admin, [adminField]: value },
      });
      switch (adminField) {
        case "first_name":
          setAdminFirstNameError(null);
          break;
        case "sur_name":
          setAdminSurNameError(null);
          break;
        case "email":
          setAdminEmailError(null);
          break;
        case "phone_number":
          setAdminPhoneError(null);
          break;
        case "password":
        case "password2":
          setAdminPasswordError(null);
          break;
      }
    } else {
      setFormData({ ...formData, [name]: value });
      switch (name) {
        case "name":
          setNameError(null);
          break;
        case "description":
          setDescriptionError(null);
          break;
        case "email":
          setOrgEmailError(null);
          break;
        case "phone":
          setPhoneError(null);
          break;
        case "address":
          setAddressError(null);
          break;
        case "field": // Handle new field
          setFieldError(null);
          break;
      }
    }
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNameError(null);
    setDescriptionError(null);
    setOrgEmailError(null);
    setPhoneError(null);
    setAddressError(null);
    setFieldError(null); // Reset new field error
    setAdminFirstNameError(null);
    setAdminSurNameError(null);
    setAdminEmailError(null);
    setAdminPhoneError(null);
    setAdminPasswordError(null);
    setGeneralError(null);

    if (formData.admin.password !== formData.admin.password2) {
      setAdminPasswordError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(formData.admin.password)) {
      setAdminPasswordError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/organisation/register-org/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.name) setNameError(data.name[0]);
        if (data.description) setDescriptionError(data.description[0]);
        if (data.email) setOrgEmailError(data.email[0]);
        if (data.phone) setPhoneError(data.phone[0]);
        if (data.address) setAddressError(data.address[0]);
        if (data.field) setFieldError(data.field[0]); // Handle new field error

        if (data.admin) {
          if (data.admin.first_name) setAdminFirstNameError(data.admin.first_name[0]);
          if (data.admin.sur_name) setAdminSurNameError(data.admin.sur_name[0]);
          if (data.admin.email) setAdminEmailError(data.admin.email[0]);
          if (data.admin.phone_number) setAdminPhoneError(data.admin.phone_number[0]);
          if (data.admin.password) setAdminPasswordError(data.admin.password[0]);
          if (data.admin.password2) setAdminPasswordError(data.admin.password2[0]);
        }

        if (data.error) {
          setGeneralError(data.error);
        } else if (!Object.keys(data).length) {
          setGeneralError("An unexpected server error occurred");
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 2000);
      }
    } catch (err) {
      console.error("Network error:", err);
      setGeneralError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Register Organization</h1>
        <p className="text-gray-600 dark:text-gray-400">Create your organization and become its admin</p>
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
              <h3 className="text-xl font-semibold mb-2">Organization Registered Successfully!</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="org-registration-form">
              <h2 className="text-lg font-semibold">Organization Details</h2>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="Enter organization name"
                />
                {nameError && <p className="text-red-600 dark:text-red-400 text-sm">{nameError}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="Describe your organization"
                />
                {descriptionError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{descriptionError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Organization Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="org@example.com"
                />
                {orgEmailError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{orgEmailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
                {phoneError && <p className="text-red-600 dark:text-red-400 text-sm">{phoneError}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="Enter organization address"
                />
                {addressError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{addressError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="field" className="text-sm font-medium">
                  Field of Data
                </label>
                <input
                  id="field"
                  name="field"
                  type="text"
                  value={formData.field}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="e.g., Diseases, Technology, Environmental Science"
                />
                {fieldError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{fieldError}</p>
                )}
              </div>

              <h2 className="text-lg font-semibold">Admin Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="admin.first_name" className="text-sm font-medium">
                    First Name
                  </label>
                  <input
                    id="admin.first_name"
                    name="admin.first_name"
                    type="text"
                    value={formData.admin.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                    placeholder="Enter first name"
                  />
                  {adminFirstNameError && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{adminFirstNameError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin.sur_name" className="text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    id="admin.sur_name"
                    name="admin.sur_name"
                    type="text"
                    value={formData.admin.sur_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                    placeholder="Enter last name"
                  />
                  {adminSurNameError && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{adminSurNameError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="admin.email" className="text-sm font-medium">
                  Admin Email
                </label>
                <input
                  id="admin.email"
                  name="admin.email"
                  type="email"
                  value={formData.admin.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="admin@example.com"
                />
                {adminEmailError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{adminEmailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="admin.phone_number" className="text-sm font-medium">
                  Admin Phone
                </label>
                <input
                  id="admin.phone_number"
                  name="admin.phone_number"
                  type="tel"
                  value={formData.admin.phone_number}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
                {adminPhoneError && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{adminPhoneError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="admin.password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="admin.password"
                    name="admin.password"
                    type="password"
                    value={formData.admin.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                    placeholder="Enter password"
                  />
                  {adminPasswordError && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{adminPasswordError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin.password2" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <input
                    id="admin.password2"
                    name="admin.password2"
                    type="password"
                    value={formData.admin.password2}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-colors"
                    placeholder="Confirm password"
                  />
                </div>
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
                  "Register Organization"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddOrganizationForm;