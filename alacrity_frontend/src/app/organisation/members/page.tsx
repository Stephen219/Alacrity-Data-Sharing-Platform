/* eslint-disable @typescript-eslint/no-unused-vars */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"



import { BACKEND_URL } from "@/config" 
import { fetchWithAuth } from "@/libs/auth"
import { withAccessControl } from "@/components/auth_guard/AccessControl"


type User = {
  id: number;
  email: string;
  first_name: string;
  sur_name: string;
  phone_number: string;
  role: string;
  date_joined: string;
  date_of_birth: string | null;
  profile_picture: string;
}

const fetchOrgMembers = async (): Promise<User[] | null> => {
  try {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/org_members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch organization members')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching org members:', error)
    return null
  }
}

 function AllMembersPage() {
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
 

 

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const fetchedMembers = await fetchOrgMembers()
        if (fetchedMembers) {
          setMembers(fetchedMembers)
        } else {
          setError("Failed to load organization members")
        }
      } catch (err) {
        setError("An error occurred while loading members")
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [])

  
  const filteredMembers = members.filter(member => 
    `${member.first_name} ${member.sur_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone_number.includes(searchQuery)
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  if (loading) return <div className="container mx-auto py-8 px-4">Loading members...</div>
  if (error) return <div className="container mx-auto py-8 px-4">Error: {error}</div>

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Organization Members</h1>

      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute left-2 top-2.5 h-4 w-4 text-gray-500">
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
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F47521]"
          />
        </div>

        <a href="/organisation/contributors/add" className="bg-[#F47521] hover:bg-[#D35E10] text-white px-4 py-2 rounded-md flex items-center">
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
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Add Members
        </a>
      </div>

      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Avatar
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.profile_picture ? (
                      <img
                        src={member.profile_picture}
                        alt={`${member.first_name} ${member.sur_name}`}
                        className="rounded-full w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="rounded-full w-10 h-10 bg-[#FF6B1A] flex items-center justify-center text-white text-lg font-bold">
                        {member.first_name?.[0]?.toUpperCase() || ""}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {member.first_name} {member.sur_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link href={`/organisation/members/${member.id}`}>
                      <button className="text-[#F47521] hover:text-[#D35E10] border border-[#F47521] hover:border-[#D35E10] px-3 py-1 rounded-md text-sm">
                        View Profile
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No members found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default withAccessControl(AllMembersPage, ["organization_admin"])  