// Login.jsx - Browser compatible version
const { useState } = React;

const XynqLogin = () => {
  const [userType, setUserType] = useState('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: userType,
          email: email,
          password: password
        })
      });
      
      if (response.ok) {
        console.log('Login successful');
        // Redirect after successful login
        window.location.href = '/dashboard'; // Change this to your desired redirect
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', {
    className: "min-h-screen flex justify-center items-center",
    style: {
      background: 'linear-gradient(120deg, #0d0d0d, #1a1a1a)',
      fontFamily: 'Inter, sans-serif'
    }
  }, 
    React.createElement('div', {
      className: "w-full max-w-3xl bg-gray-900 p-10 rounded-2xl shadow-2xl text-white",
      style: { backgroundColor: '#1c1c1c' }
    },
      // Title
      React.createElement('h1', {
        className: "text-center text-4xl font-bold mb-8",
        style: {
          background: 'linear-gradient(90deg, #f3567d, #ff8c66)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }
      }, 'Xynq - Login'),
      
      // Form container
      React.createElement('div', { className: "flex flex-col gap-6" },
        // Form title
        React.createElement('h2', {
          className: "text-center text-3xl mb-5",
          style: { color: '#00d1ff' }
        }, 'What type of user are you?'),
        
        // Error message
        error && React.createElement('div', {
          className: "text-red-500 text-center p-3 bg-red-100 bg-opacity-10 rounded"
        }, error),
        
        // Radio buttons
        React.createElement('div', { className: "flex justify-around items-center my-4" },
          React.createElement('label', {
            className: `px-6 py-3 border-2 rounded-full font-bold cursor-pointer transition-all duration-300 ${
              userType === 'candidate' ? 'text-white' : 'text-blue-500'
            }`,
            style: {
              background: userType === 'candidate' 
                ? 'linear-gradient(90deg, #007BFF, #00D1FF)' 
                : '#1c1c1c',
              borderColor: '#007BFF'
            }
          },
            React.createElement('input', {
              type: "radio",
              name: "type",
              value: "candidate",
              checked: userType === 'candidate',
              onChange: (e) => setUserType(e.target.value),
              style: { display: 'none' }
            }),
            'Candidate'
          ),
          React.createElement('label', {
            className: `px-6 py-3 border-2 rounded-full font-bold cursor-pointer transition-all duration-300 ${
              userType === 'interviewer' ? 'text-white' : 'text-blue-500'
            }`,
            style: {
              background: userType === 'interviewer' 
                ? 'linear-gradient(90deg, #007BFF, #00D1FF)' 
                : '#1c1c1c',
              borderColor: '#007BFF'
            }
          },
            React.createElement('input', {
              type: "radio",
              name: "type",
              value: "interviewer",
              checked: userType === 'interviewer',
              onChange: (e) => setUserType(e.target.value),
              style: { display: 'none' }
            }),
            'Interviewer'
          )
        ),
        
        // Email field
        React.createElement('div', { className: "flex flex-col" },
          React.createElement('label', {
            htmlFor: "email",
            className: "mb-2 text-sm"
          }, 'Email'),
          React.createElement('input', {
            type: "email",
            id: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "Enter your email",
            required: true,
            className: "p-3 border-none rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            style: { backgroundColor: '#2c2c2c' }
          })
        ),
        
        // Password field
        React.createElement('div', { className: "flex flex-col" },
          React.createElement('label', {
            htmlFor: "password",
            className: "mb-2 text-sm"
          }, 'Password'),
          React.createElement('input', {
            type: "password",
            id: "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "Enter your password",
            required: true,
            className: "p-3 border-none rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            style: { backgroundColor: '#2c2c2c' }
          })
        ),
        
        // Submit button
        React.createElement('button', {
          onClick: handleSubmit,
          disabled: loading,
          className: "text-white p-3 border-none rounded-lg text-lg font-bold cursor-pointer transition-all duration-300 hover:-translate-y-1 disabled:opacity-50",
          style: {
            background: loading ? '#666' : 'linear-gradient(90deg, #007BFF, #00D1FF)'
          }
        }, loading ? 'Logging in...' : 'Log in')
      ),
      
      // Sign up link
      React.createElement('p', { className: "text-center mt-5 text-sm" },
        "Don't have an account? ",
        React.createElement('a', {
          href: "/register",
          className: "font-bold no-underline hover:text-blue-500 transition-colors",
          style: { color: '#00D1FF' }
        }, 'Sign up')
      ),
      
      // Features section
      React.createElement('div', { className: "flex justify-center gap-8 mt-12 text-white" },
        React.createElement('div', { className: "text-center max-w-xs" },
          React.createElement('i', { 
            className: "fas fa-lock text-4xl mb-3 block",
            style: { color: '#00D1FF' }
          }),
          React.createElement('h4', { className: "text-lg mb-2" }, 'Secure & Private'),
          React.createElement('p', { 
            className: "text-sm",
            style: { color: '#ccc' }
          }, "We prioritize your data's security and privacy.")
        ),
        React.createElement('div', { className: "text-center max-w-xs" },
          React.createElement('i', { 
            className: "fas fa-bolt text-4xl mb-3 block",
            style: { color: '#00D1FF' }
          }),
          React.createElement('h4', { className: "text-lg mb-2" }, 'Fast & Reliable'),
          React.createElement('p', { 
            className: "text-sm",
            style: { color: '#ccc' }
          }, 'Experience lightning-fast connections anywhere.')
        ),
        React.createElement('div', { className: "text-center max-w-xs" },
          React.createElement('i', { 
            className: "fas fa-globe text-4xl mb-3 block",
            style: { color: '#00D1FF' }
          }),
          React.createElement('h4', { className: "text-lg mb-2" }, 'Connect Globally'),
          React.createElement('p', { 
            className: "text-sm",
            style: { color: '#ccc' }
          }, 'Bridge distances with seamless global access.')
        )
      ),
      
      // Social media links
      React.createElement('div', { className: "mt-5 flex justify-center gap-4" },
        React.createElement('a', {
          href: "https://facebook.com",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-white text-xl transition-all duration-200 hover:scale-110",
          style: { color: '#fff' }
        }, React.createElement('i', { className: "fab fa-facebook" })),
        React.createElement('a', {
          href: "https://twitter.com",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-white text-xl transition-all duration-200 hover:scale-110",
          style: { color: '#fff' }
        }, React.createElement('i', { className: "fab fa-twitter" })),
        React.createElement('a', {
          href: "https://instagram.com",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-white text-xl transition-all duration-200 hover:scale-110",
          style: { color: '#fff' }
        }, React.createElement('i', { className: "fab fa-instagram" }))
      ),
      
      // Footer
      React.createElement('footer', { 
        className: "mt-10 text-center text-sm",
        style: { color: '#777' }
      },
        React.createElement('p', null, '© 2025 Xynq. All rights reserved.'),
        React.createElement('div', { className: "mt-1" },
          React.createElement('a', {
            href: "#",
            className: "mx-3 no-underline hover:text-white transition-colors",
            style: { color: '#aaa' }
          }, 'About Us'),
          React.createElement('a', {
            href: "#",
            className: "mx-3 no-underline hover:text-white transition-colors",
            style: { color: '#aaa' }
          }, 'Privacy Policy'),
          React.createElement('a', {
            href: "#",
            className: "mx-3 no-underline hover:text-white transition-colors",
            style: { color: '#aaa' }
          }, 'Help Center')
        )
      )
    )
  );
};

// Render the component
ReactDOM.render(React.createElement(XynqLogin), document.getElementById('root'));