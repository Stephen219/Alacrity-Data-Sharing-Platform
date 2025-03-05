"use client"

import { useState } from "react"
import Link from "next/link"

export default function MemberProfilePage({ params }: { params: { id: string } }) {
  const [accountDisabled, setAccountDisabled] = useState(false)
  const employee = {
    id: params.id,
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@example.com",
    phone: "+1 (555) 123-4567",
    avatar: "/placeholder.svg?height=200&width=200",
    department: "Engineering",
    position: "Senior Developer",
    joinDate: "January 15, 2022",
    followers: 245,
    following: 112,
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-gray-500 hover:text-gray-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          Back to All Members
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - Profile info */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center">
              <img
                src={employee.avatar || "/placeholder.svg"}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="rounded-full w-32 h-32 object-cover mb-4"
              />
              <h2 className="text-2xl font-bold">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-gray-500 mb-4">{employee.position}</p>

              <div className="flex space-x-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#F47521]">{employee.followers}</p>
                  <p className="text-sm text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#F47521]">{employee.following}</p>
                  <p className="text-sm text-gray-500">Following</p>
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-2 text-gray-500"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-2 text-gray-500"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-2 text-gray-500"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>{employee.department}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Additional info and actions */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Account Information</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p>{employee.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p>{employee.lastName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p>{employee.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p>{employee.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p>{employee.department}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p>{employee.position}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Join Date</p>
                <p>{employee.joinDate}</p>
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            <h3 className="text-xl font-semibold mb-4">Account Management</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="disable-account" className="font-medium">
                    Disable Account
                  </label>
                  <p className="text-sm text-gray-500">Temporarily disable this user's account</p>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="disable-account"
                    name="disable-account"
                    className="sr-only"
                    checked={accountDisabled}
                    onChange={() => setAccountDisabled(!accountDisabled)}
                  />
                  <label
                    htmlFor="disable-account"
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer ${accountDisabled ? "bg-[#F47521]" : "bg-gray-300"}`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${accountDisabled ? "translate-x-4" : "translate-x-0"}`}
                    ></span>
                  </label>
                </div>
              </div>

              <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="17" x2="22" y1="8" y2="13"></line>
                  <line x1="22" x2="17" y1="8" y2="13"></line>
                </svg>
                Remove Member
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Team Members</h3>
              <button className="border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded-md text-sm flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                View All
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4, 5].map((id) => (
                <div key={id} className="flex flex-col items-center">
                  <img
                    src={`/placeholder.svg?height=50&width=50`}
                    alt={`Team member ${id}`}
                    className="rounded-full w-12 h-12 object-cover mb-2"
                  />
                  <span className="text-xs">Member {id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

