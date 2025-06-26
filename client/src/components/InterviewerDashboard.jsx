import React, { useEffect } from 'react';
import './InterviewerDashboard.css';

const InterviewerDashboard = () => {
  useEffect(() => {
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) {
      window.location.href = '/login';
    }

    const requestBtn = document.getElementById('requestInterviewButton');
    const startBtn = document.getElementById('startInterviewButton');
    const upcomingCard = document.getElementById('upcomingInterviewsCard');
    const navLink = document.getElementById('interviewsLink');

    if (requestBtn)
      requestBtn.addEventListener('click', handleRequestInterview);
    if (startBtn)
      startBtn.addEventListener('click', handleStartInterview);
    if (upcomingCard)
      upcomingCard.addEventListener('click', navigateToCalendar);
    if (navLink)
      navLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToCalendar();
      });

    return () => {
      if (requestBtn)
        requestBtn.removeEventListener('click', handleRequestInterview);
      if (startBtn)
        startBtn.removeEventListener('click', handleStartInterview);
    };
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const getInterviewerEmail = () => {
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) return null;
    try {
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));
      return payload.email;
    } catch (e) {
      console.error("Error decoding JWT:", e);
      return null;
    }
  };

  const getInterviewerId = async (email) => {
    try {
      const res = await fetch(`/api/interviewer?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to fetch interviewer ID');
      const data = await res.json();
      return data.interviewer_id;
    } catch (e) {
      console.error("Error getting interviewer ID:", e);
      return null;
    }
  };

  const navigateToCalendar = async () => {
    const overlay = document.getElementById('loadingOverlay');
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) {
      alert('You must be logged in to view upcoming interviews.');
      window.location.href = '/login';
      return;
    }

    overlay.style.display = 'flex';

    const email = getInterviewerEmail();
    const id = await getInterviewerId(email);
    if (!id) {
      overlay.style.display = 'none';
      alert('Unable to fetch interviewer data.');
      return;
    }
    window.location.href = `/calendar?interviewer_id=${id}`;
  };

  const handleRequestInterview = (e) => {
    e.preventDefault();
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) {
      alert('You must be logged in to request an interview.');
      window.location.href = '/login';
    } else {
      window.location.href = '/request-interview';
      
    }
  };

  const handleStartInterview = (e) => {
    e.preventDefault();
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) {
      alert('You must be logged in as an interviewer to start the interview.');
      window.location.href = '/login';
    } else {
      const roomId = window.roomId; // Backend should set this via script or meta tag
      if (roomId) {
        window.location.href = `/room/${roomId}`;
      } else {
        alert("Room ID is missing.");
      }
    }
  };

  return (
    <div className="dashboard-container">
      {/* Background Effects */}
      <div className="background-effects">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      <header className="header">
        <div className="header-content">
          <h1>Interviewer Dashboard</h1>
          <p className="header-subtitle">Manage your interviews with ease</p>
        </div>
        <div className="header-decoration"></div>
      </header>

      <nav className="nav">
        <div className="nav-container">
          <a href="/interviewerDashboard" className="nav-item active">
            <span className="nav-icon">📊</span>
            Dashboard
          </a>
          <a href="#" id="interviewsLink" className="nav-item">
            <span className="nav-icon">📅</span>
            Interviews
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">👥</span>
            Candidates
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </a>
          <a href="/logout" className="nav-item logout">
            <span className="nav-icon">🚪</span>
            Logout
          </a>
        </div>
      </nav>

      <main className="main">
        <div className="welcome-section">
          <h2>Welcome back! 👋</h2>
          <p>Here's what's happening with your interviews today</p>
        </div>

        <div className="dashboard-grid">
          <div className="card priority-card" data-icon="📅" id="upcomingInterviewsCard">
            <div className="card-header">
              <div className="card-icon">📅</div>
              <div className="card-badge">3 Today</div>
            </div>
            <h3>Upcoming Interviews</h3>
            <p>You have 3 interviews scheduled for today.</p>
            <div className="card-footer">
              <span className="card-time">Next in 2 hours</span>
            </div>
          </div>

          <div className="card" data-icon="⏳">
            <div className="card-header">
              <div className="card-icon">⏳</div>
              <div className="card-badge urgent">2 Pending</div>
            </div>
            <h3>Pending Feedback</h3>
            <p>2 candidates are awaiting your feedback.</p>
            <div className="card-footer">
              <span className="card-time">Overdue by 1 day</span>
            </div>
          </div>

          <div className="card" data-icon="✅">
            <div className="card-header">
              <div className="card-icon">✅</div>
              <div className="card-badge success">12 Total</div>
            </div>
            <h3>Completed Interviews</h3>
            <p>Review your past interviews and notes.</p>
            <div className="card-footer">
              <span className="card-time">Last completed today</span>
            </div>
          </div>

          <div className="card" data-icon="👤">
            <div className="card-header">
              <div className="card-icon">👤</div>
            </div>
            <h3>Profile Management</h3>
            <p>Manage your profile and settings.</p>
            <div className="card-footer">
              <span className="card-time">Last updated yesterday</span>
            </div>
          </div>

          <div className="card action-card" data-icon="📝">
            <div className="card-header">
              <div className="card-icon">📝</div>
            </div>
            <h3>Request an Interview</h3>
            <p>Schedule an interview with a candidate.</p>
            <form action="/request-interview">
              <button id="requestInterviewButton" className="action-button primary">
                <span className="button-icon">📝</span>
                Request Interview
              </button>
            </form>
          </div>

          <div className="card action-card start-card" data-icon="🎥">
            <div className="card-header">
              <div className="card-icon">🎥</div>
            </div>
            <h3>Start Interview Now</h3>
            <p>Jump into an active interview session.</p>
            <form>
              <button id="startInterviewButton" className="action-button secondary">
                <span className="button-icon">🚀</span>
                Start Interview
              </button>
            </form>
          </div>
        </div>
      </main>

      <div className="loading-overlay" id="loadingOverlay">
        <div className="loading-content">
          <div className="modern-spinner"></div>
          <p>Loading your data...</p>
        </div>
      </div>

      <footer>
        <div className="footer-content">
          <p>&copy; 2025 Xynq. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InterviewerDashboard;