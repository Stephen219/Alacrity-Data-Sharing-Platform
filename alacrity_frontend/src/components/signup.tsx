"use client";
import { useState } from "react"

import { BACKEND_URL } from "@/config";


export default function SignUp() {

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstname: "",
        surname: "",
        phonenumber: "",
        field: "",
        role: "",
    });

    const [serverError, setServerError] = useState("")
    const [serverMessage, setServerMessage] = useState("")

    const validateForm = () => {
        const { email, password, firstname, surname, phonenumber, field, role } = formData;
    
        // Email regex pattern for basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
        // Password regex pattern for at least one uppercase, one lowercase, one digit, and one special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    
        // Check if all fields are filled
        if (!email || !password || !firstname || !surname || !phonenumber || !field || !role) {
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
            setServerError("Password must be at least 8 characters, contain uppercase, lowercase, a number, and a special character.");
            return false;
        }
    
        // Validate phone number length (assuming it's numeric)
        if (phonenumber.length !== 11) {
            setServerError("Phone number must be exactly 11 characters.");
            return false;
        }
    
        // Clear the error message if everything is valid
        setServerError("");
        setServerMessage("Form is valid!");
        return true;
    };
    

}

export default SignUp;
