"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstname: "",
    surname: "",
    phonenumber: "",
    field: "",
    confirmPassword: ""
  });

  const [serverError, setServerError] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");

  const validateForm = () => {
    const { email, password, firstname, surname, phonenumber, field, confirmPassword } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!email || !password || !firstname || !surname || !phonenumber || !field || !confirmPassword) {
      setServerError("All fields must be filled.");
      return false;
    }

    if (!emailRegex.test(email)) {
      setServerError("Please enter a valid email address.");
      return false;
    }

    if (!passwordRegex.test(password)) {
      setServerError(
        "Password must be at least 8 characters, contain uppercase, lowercase, a number, and a special character."
      );
      return false;
    }

    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(phonenumber)) {
      setServerError("Phone number must be numeric and 11 characters long.");
      return false;
    }

    if (password !== formData.confirmPassword) {
      setServerError("Passwords do not match.");
      return false;
    }

    setServerError("");
    setServerMessage("Form is valid!");
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      email: formData.email,
      password: formData.password,
      firstname: formData.firstname,
      surname: formData.surname,
      phonenumber: formData.phonenumber,
      field: formData.field
    };

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/users/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setEmailError(errorData?.email?.[0] || "");
        setPhoneError(errorData?.phone_number?.[0] || "");
        setNameError(errorData?.name?.[0] || "");
    
        if (!errorData || Object.keys(errorData).length === 0) {
            setServerError("An error occurred. Please try again.");
        } else {
            setServerError("");
        }
    
        console.log("Full API Error Response:", errorData);
    
        throw new Error(errorData?.message || "Something went wrong. Please check your input and try again.");

    }

      const data = await response.json();
      setServerMessage(data.message || "Signup successful!");
      setServerError("");
      router.push("/auth/sign-in");
    } catch (error) {
      console.error("Signup error:", error);
      setServerError(error instanceof Error ? error.message : "An error occurred. Please try again later.");
      setServerMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear errors when user starts typing
    if (serverError) setServerError("");
    if (serverMessage) setServerMessage("");
  };

  return (
    <div className="min-h-screen bg-card py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-black mb-2">
            ALACRITY
          </h1>
          <p className="text-gray-600 text-lg">Join us today and get access to quick data</p>
          <div className="flex flex-col space-y-2"><Link href="/auth/sign-up/org-sign-up" className="text-[#f97316] text-sm text-center">
            Sign up as an organization
          </Link>
          <Link href="/auth/sign-in/" className="text-[#f97316] text-sm text-center">
           Have an account? Sign in
          </Link> </div>
        </div>
        <form className="space-y-6" onSubmit={handleFormSubmit} noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="firstname" className="text-sm font-medium text-gray-700 mb-1 block">
                First Name
              </label>
              <input
                id="firstname"
                type="text"
                name="firstname"
                value={formData.firstname}
                className="w-full px-4 py-2 border dark:bg-gray-200 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                onChange={handleInputChange}
                placeholder="John"
                aria-invalid={serverError && !formData.firstname ? "true" : "false"}
                aria-describedby={serverError ? "error-message" : undefined}
                required
              />

            </div>
            <div className="relative">
              <label htmlFor="surname" className="text-sm font-medium text-gray-700 mb-1 block">
                Surname
              </label>
              <input
                id="surname"
                type="text"
                name="surname"
                value={formData.surname}
                className="w-full dark:bg-gray-200 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                onChange={handleInputChange}
                placeholder="Doe"
                aria-invalid={serverError && !formData.surname ? "true" : "false"}
                aria-describedby={serverError ? "error-message" : undefined}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="phonenumber" className="text-sm font-medium text-gray-700 mb-1 block">
                Phone Number
              </label>
              <input
                id="phonenumber"
                type="tel"
                name="phonenumber"
                value={formData.phonenumber}
                className="w-full dark:bg-gray-200 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                onChange={handleInputChange}
                placeholder="12345678901"
                aria-invalid={serverError && !formData.phonenumber ? "true" : "false"}
                aria-describedby={serverError ? "error-message" : undefined}
                required
              />
              {phoneError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {phoneError}
                </div>
              )}
          </div>

            <div className="relative">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                className="w-full px-4 py-2 border dark:bg-gray-200 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                onChange={handleInputChange}
                placeholder="john.doe@example.com"
              />

              {emailError && (
                <p 
                  role="alert"
                  data-testid="error-message"
                  id="title-error"
                  className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
                >
                  {emailError}
                </p>
              )}



            </div>

            <div className="relative">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                className="w-full dark:bg-gray-200 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                onChange={handleInputChange}
                placeholder="••••••••"
                aria-invalid={serverError && !formData.password ? "true" : "false"}
                aria-describedby={serverError ? "error-message" : undefined}
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1 block">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                className="w-full dark:bg-gray-200 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                onChange={handleInputChange}
                placeholder="••••••••"
                aria-invalid={serverError && !formData.confirmPassword ? "true" : "false"}
                aria-describedby={serverError ? "error-message" : undefined}
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="field" className="text-sm font-medium text-gray-700 mb-1 block">
                Field
              </label>
              <input
                id="field"
                type="text"
                name="field"
                value={formData.field}
                className="w-full px-4 dark:bg-gray-200 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                onChange={handleInputChange}
                placeholder="Your field of expertise"
                aria-invalid={serverError && !formData.field ? "true" : "false"}
                aria-describedby={serverError ? "error-message" : undefined}
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full dark:bg-orange-500 dark:hover:bg-orange-300"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
          </div>
         

          <div
              role="alert"
              data-testid="error-message"
              className={`mt-4 p-3 border rounded-lg text-sm ${
                serverError ? "bg-red-50 border-red-200 text-red-600" : "hidden"
              }`}
              aria-hidden={serverError ? "false" : "true"}
            >
              {serverError || ""}
          </div>

          <div
            role="alert"
            data-testid="success-message"
            className={`mt-4 p-3 border rounded-lg text-sm ${
              serverMessage ? "bg-green-50 border-green-200 text-green-600" : "hidden"
            }`}
            aria-hidden={serverMessage ? "false" : "true"}
          >
            {serverMessage || ""}
          </div>
    

          {nameError && (
            <p className="text-red-500 text-xs">{nameError}</p>
          )}

        </form>
      </div>
    </div>
  );
}