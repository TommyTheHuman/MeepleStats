import { useState } from "react";

function LoginForm() {

    const [formData, setFormData] = useState({
        username: '',
        password: '',
      });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      };

    const handleLoginSubmit = async (e) => {
        e.preventDefault(); // Previene il refresh della pagina
        try {
          const response = await fetch('http://127.0.0.1:5000/login', {
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
      };

    return ( 
        <form onSubmit={handleLoginSubmit}>
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
        <button type="submit">Login</button>
      </form>
     );
}

export default LoginForm;