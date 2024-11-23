import { useState } from "react";

function RegisterForm() {

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

    const [errors, setErrors] = useState({
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = () => {
        let isValid = true;
        if (formData.password !== formData.confirmPassword) {
            setErrors((prev) => ({
                ...prev,
                password: 'Passwords do not match',
            }));
            isValid = false;
        } else {
            setErrors((prev) => ({
                ...prev,
                password: '',
            }));
        }
        return isValid;
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault(); // Previene il refresh della pagina
        if (!validateForm()) return;
        try {
          const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
    
          if (response.ok) {
            const data = await response.json();
            console.log('Success:', data);
            // Azioni dopo il successo, es. reindirizzamento
          } else {
            console.error('Error:', response.statusText);
          }
        } catch (error) {
          console.error('Fetch Error:', error);
        }
    }   

    return ( 
        <form onSubmit={handleRegisterSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
            />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
            />
        </div>
        {errors.password && <p>{errors.password}</p>}
        <button type="submit">Register</button>
      </form>
            
     );
    
}

export default RegisterForm;