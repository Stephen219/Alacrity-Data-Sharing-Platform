'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/libs/auth';
import { BACKEND_URL } from '@/config';

export default function AddContributorForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    sur_name: '',
    email: '',
    phone_number: '', 
    role: 'contributor',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/organisation/add_contributor/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      alert('Contributor added successfully!');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="first_name" className="block font-medium">First Name</label>
        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full p-2 border rounded" />
      </div>
      <div>
        <label htmlFor="sur_name" className="block font-medium">Last Name</label>
        <input type="text" name="sur_name" value={formData.sur_name} onChange={handleChange} required className="w-full p-2 border rounded" />
      </div>
      <div>
        <label htmlFor="email" className="block font-medium">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2 border rounded" />
      </div>
      <div>
        <label htmlFor="phone_number" className="block font-medium">Phone Number</label>
        <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} required className="w-full p-2 border rounded" />
      </div>
      <div>
        <label htmlFor="role" className="block font-medium">Role</label>
        <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="contributor">Contributor</option>
          <option value="organization_admin">Organization Admin</option>
        </select>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="w-full p-2 bg-blue-500 text-white rounded">
        {loading ? 'Submitting...' : 'Add Contributor'}
      </button>
    </form>
  );
}
