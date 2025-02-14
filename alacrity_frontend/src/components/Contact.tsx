"use client";

import { useState } from "react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Button } from "./ui/button";
import { validateString, getErrorMessage } from "@/lib/utils"; 

export default function Contact() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        subject: "",
        message: "",
    });
    const [errors, setErrors] = useState<{ email?: string; subject?: string; message?: string }>({});

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

    // ✅ Improved Email Validation
    const isValidEmail = (email: string) => {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });

        setErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: undefined }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const newErrors: { email?: string; subject?: string; message?: string } = {};

        if (!validateString(formData.email, 100) || !isValidEmail(formData.email)) {
            newErrors.email = "Invalid email format. Please enter a valid email.";
        }
        if (!validateString(formData.subject, 150)) {
            newErrors.subject = "Subject must be less than 150 characters.";
        }
        if (!validateString(formData.message, 5000)) {
            newErrors.message = "Message is too long (max 5000 characters).";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/contact/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            setLoading(false);

            if (result.error) {
                setErrors({ email: getErrorMessage(result.error) });
            } else {
                alert("Email sent successfully!");
                setFormData({ email: "", subject: "", message: "" });
            }
        } catch (error) {
            setLoading(false);
            setErrors({ email: getErrorMessage(error) });
        }
    };

    return (
        <MaxWidthWrapper>
            <section className="bg-white border-black border mt-32 shadow-2xl rounded-2xl dark:bg-gray-900">
                <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
                    <h2 className="mb-4 text-4xl text-bold tracking-tight text-center dark:text-white">
                        Contact Us
                    </h2>
                    <p className="mb-8 lg:mb-16 tracking-tight text-center dark:text-gray-400 sm:text-xl">
                        Need to get in touch? Send us a message.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8" data-testid="contact-form">
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Your email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="shadow-sm bg-secondary border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:outline"
                                placeholder="name@example.com"
                                required
                            />
                            
                            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-900">
                                Subject
                            </label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="block p-3 w-full text-sm text-gray-900 bg-secondary rounded-lg border border-gray-300 shadow-sm focus:outline"
                                placeholder="Briefly describe your inquiry"
                                required
                            />
                            
                            {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900">
                                Your message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={6}
                                className="block p-2.5 w-full text-sm text-gray-900 bg-secondary rounded-lg border border-gray-300 focus:outline"
                                placeholder="Please provide more details..."
                                required
                            ></textarea>
                          
                            {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="py-3 px-5 text-sm font-medium text-center text-white rounded-lg bg-primary sm:w-fit hover:bg-orange-400"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send Message"}
                        </Button>
                    </form>
                </div>
            </section>
        </MaxWidthWrapper>
    );
}
