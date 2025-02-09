"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation"; // Changed from next/router

export default function SignUp() {
    const router = useRouter(); // 
  // State to store form data
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

  // Handle and validate form submission before they are sent to the server
  const validateForm = () => {
    const { email, password, firstname, surname, phonenumber, field, confirmPassword } = formData;

    // Email regex pattern for basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Password regex pattern for at least one uppercase, one lowercase, one digit, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    // Check if all fields are filled
    if (!email || !password || !firstname || !surname || !phonenumber || !field || !confirmPassword) {
      setServerError("All fields must be filled.");
      return false;
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      setServerError("Please enter a valid email address.");
      return false;
    }

    // Validate password length and complexity
    if (!passwordRegex.test(password)) {
      setServerError(
        "Password must be at least 8 characters, contain uppercase, lowercase, a number, and a special character."
      );
      return false;
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(phonenumber)) {
      setServerError("Phone number must be numeric and 11 characters long.");
      return false;
    }

    // Check if password and confirm password match
    if (password !== formData.confirmPassword) {
      setServerError("Passwords do not match.");
      return false;
    }

    // Clear the error message if everything is valid
    setServerError("");
    setServerMessage("Form is valid!");
    return true;
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Prepare form data to be sent to the server as JSON
    const payload = {
        email: formData.email,
        password: formData.password,
        firstname: formData.firstname,
        surname: formData.surname,
        phonenumber: formData.phonenumber,
        field: formData.field
      };

    setLoading(true); // Set loading state to true when form is submitted

    console.log("Form Data being sent:", payload);

    try {
      const response = await fetch(`${BACKEND_URL}datasets/sign_up/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

        const data = await response.json();
        setServerMessage(data.message);
        setServerError("");
        router.push("/sign-in");
    } catch (error) {
        console.error("Signup error:", error);
        setServerError(error instanceof Error ? error.message : "An error occurred. Please try again later.");
        setServerMessage("");
    } finally {
        setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen px-4 space-y-8">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-5xl font-extrabold text-gray-800">ALACRITY</h1> {/* Bolder and bigger heading */}
        <span className="text-lg font-light">Join us today and get access to quick data</span>
      </div>
      <form className="flex flex-col w-full max-w-full md:max-w-md space-y-4" onSubmit={handleFormSubmit}>
        {/* Form inputs go here */}
        <div className="flex flex-row space-x-4">
          <input
            type="text"
            name="firstname"
            placeholder="First Name"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleInputChange}
            autoFocus
          />
          <input
            type="text"
            name="surname"
            placeholder="Surname"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleInputChange}
          />
        </div>
        <div className="flex flex-col space-y-4">
          <input
            type="tel"
            name="phonenumber"
            placeholder="Phone Number"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleInputChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleInputChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleInputChange}
          />
          {/* Confirm Password */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="field"
            placeholder="Field"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleInputChange}
          />
        </div>

        {/* Sign-Up Button */}
        <Button type="submit" className="w-full p-2" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </Button>

        {serverError && <p className="text-red-500">{serverError}</p>}
        {serverMessage && <p className="text-green-500">{serverMessage}</p>}
      </form>
    </div>
  );
}
