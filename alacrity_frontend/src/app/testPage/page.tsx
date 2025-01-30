
'use client'
import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@/config';



const FormPage = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await axios.post(BACKEND_URL + 'api/submit_form/', { name, message });
      setResponse(result.data.success ? 'Form submitted successfully!' + result.data.name : 'Submission failed.');
    } catch (error) {
      setResponse('Error: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Submit a Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name: </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="message">Message: </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>

      {response && <p>{response}</p>}
    </div>
  );
};

export default FormPage;  // Ensure this is the default export
