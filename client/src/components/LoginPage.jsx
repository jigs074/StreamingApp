import React from 'react';
import './LoginPage.css'; // move all your styles here or use styled-components

const LoginPage = () => {
  return (
    <div className="main">
      <h1>Xynq - Login</h1>
      <form id="login-form" className="login-form" action="/login" method="POST">
        <h2 className="form-title">What type of user are you?</h2>
        <div className="form-radio">
          <input type="radio" name="type" value="candidate" id="candidate" defaultChecked />
          <label htmlFor="candidate">Candidate</label>

          <input type="radio" name="type" value="interviewer" id="interviewer" />
          <label htmlFor="interviewer">Interviewer</label>
        </div>

        <div className="form-textbox">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required />
        </div>

        <div className="form-textbox">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" required />
        </div>

        <div className="form-textbox">
          <input type="submit" className="submit" value="Log in" />
        </div>
      </form>

      <p className="signuphere">
        Don't have an account? <a href="/register" className="signuphere-link">Sign up</a>
      </p>

      <div className="features">
        <div className="feature">
          <i className="fas fa-lock"></i>
          <h4>Secure & Private</h4>
          <p>We prioritize your data's security and privacy.</p>
        </div>
        <div className="feature">
          <i className="fas fa-bolt"></i>
          <h4>Fast & Reliable</h4>
          <p>Experience lightning-fast connections anywhere.</p>
        </div>
        <div className="feature">
          <i className="fas fa-globe"></i>
          <h4>Connect Globally</h4>
          <p>Bridge distances with seamless global access.</p>
        </div>
      </div>

      <div className="social-media">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
      </div>

      <footer className="footer">
        <p>&copy; 2025 Xynq. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">About Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Help Center</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
