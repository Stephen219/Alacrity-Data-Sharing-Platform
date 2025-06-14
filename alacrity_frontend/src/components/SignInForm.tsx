"use client";

import React from "react";
import { useState} from "react"
import { Button } from "@/components/ui/button";
import Image from "next/image";
// import { BACKEND_URL } from "@/config";

// import { useRouter } from "next/navigation";
import { login } from "@/libs/auth";

const SignInForm: React.FC = () => {


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember_me, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  

  // const router = useRouter();  ideally, we should use the router to redirect the user to the dashboard after successful login. However, we are using window.location.href for now to avoid the need to mock the router in the test file.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password, remember_me);




    if (result.success) {
      if (result.user?.role === "organization_admin" || result.user?.role === "contributor") {
        window.location.href = "/admin/dashboard";
      }
      window.location.href = "/feed";
    } else {
  
      setError(result.error || "An unknown error occurred");
    }
  };


  return (
    <section className="min-h-screen bg-card flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow-2xl md:max-w-3xl w-full overflow-hidden">
        <div className="hidden md:flex w-[50%] lg:w-[50%] bg-white items-center justify-center p-4 rounded-l-lg">
          <Image 
            src="/welcome2.png" 
            alt="Welcome Illustration" 
            width={500} 
            height={300} 
            className="object-contain"
          />
        </div>

        <div className="w-full md:w-1/2 p-6 sm:p-8">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
            <p className="text-gray-600">Sign in to your account to continue.</p>

            {error && <p className="text-red-500 text-sm">{error}</p>} 

            

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Your email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-black"
                  placeholder="name@company.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-black"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me" 
                    type="checkbox" 
                    checked={remember_me}
                    onChange={(e) => setRememberMe(e.target.checked)}


                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                   
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <a href="/auth/forgot-password" className="text-sm text-primary hover:text-orange-700">
                  Forgot password?
                </a>
              </div>

              <Button className="w-full dark:bg-orange-500" type="submit">Sign in</Button>


              <p className="text-sm text-gray-600">
                Don’t have an account yet?{" "}
                <a href="/auth/sign-up" className="text-primary hover:text-orange-700">
                  Sign up
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignInForm;
