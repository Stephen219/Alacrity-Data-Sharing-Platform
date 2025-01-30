

import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const Form = () => {
    // Define state variables for form inputs
    const [name, setName] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [response, setResponse] = useState<string>('');

    // Handle form submission
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            const result = await axios.post('http://127.0.0.1:8000/api/submit_form/', {
                name,
                message
            });

            setResponse(result.data.success ? 'Form submitted successfully!' : 'Submission failed.');
        } catch (error) {
            setResponse('Error: ' + error.message);
        }
    };

    // Handle input changes
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        setter(e.target.value);
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
                        onChange={(e) => handleInputChange(e, setName)}
                    />
                </div>
                <div>
                    <label htmlFor="message">Message: </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => handleInputChange(e, setMessage)}
                    />
                </div>
                <button type="submit">Submit</button>
            </form>

            {response && <p>{response}</p>}
        </div>
    );
};

export default Form;
