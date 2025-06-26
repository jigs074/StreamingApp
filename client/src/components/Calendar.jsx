// import React, { useState, useEffect } from 'react';
// import './Calendar.css';

// const Calendar = () => {
//   const [interviews, setInterviews] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   // Function to retrieve JWT token from cookies
//   const getCookie = (name) => {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
//     return null;
//   };

//   // Get interviewer email from JWT token
//   const getInterviewerEmail = () => {
//     const jwtToken = getCookie('jwtToken');
//     if (!jwtToken) return null;
    
//     try {
//       // Decode the JWT payload
//       const payload = JSON.parse(atob(jwtToken.split('.')[1]));
//       return payload.email;
//     } catch (e) {
//       console.error("Error decoding JWT token:", e);
//       return null;
//     }
//   };

//   // Format date for better display
//   const formatDateTime = (dateTimeStr) => {
//     const date = new Date(dateTimeStr);
//     return new Intl.DateTimeFormat('en-US', {
//       weekday: 'short',
//       month: 'short', 
//       day: 'numeric',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     }).format(date);
//   };

//   // Get time until interview
//   const getTimeUntil = (dateTimeStr) => {
//     const now = new Date();
//     const interviewTime = new Date(dateTimeStr);
//     const diff = interviewTime - now;
    
//     if (diff < 0) return 'Past';
    
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (days > 0) return `in ${days}d ${hours}h`;
//     if (hours > 0) return `in ${hours}h ${minutes}m`;
//     return `in ${minutes}m`;
//   };

//   // Fetch interviewer ID using email
//   const fetchInterviewerId = (email) => {
//     return fetch(`/api/interviewer?email=${encodeURIComponent(email)}`)
//       .then(response => {
//         if (!response.ok) {
//           throw new Error('Failed to fetch interviewer ID');
//         }
//         return response.json();
//       })
//       .then(data => {
//         return data.interviewer_id;
//       });
//   };

//   // Fetch and display interviews
//   const fetchInterviews = async () => {
//     const jwtToken = getCookie('jwtToken');
    
//     if (!jwtToken) {
//       window.location.href = '/login';
//       return;
//     }
    
//     const interviewerEmail = getInterviewerEmail();
//     if (!interviewerEmail) {
//       setError('Unable to retrieve your email from the login token. Please try logging in again.');
//       setLoading(false);
//       return;
//     }
    
//     try {
//       // Get interviewer ID from email
//       const interviewer_id = await fetchInterviewerId(interviewerEmail);
      
//       if (!interviewer_id) {
//         setError('Unable to find an interviewer account for your email. Please contact support.');
//         setLoading(false);
//         return;
//       }
      
//       // Fetch interviews using interviewer ID
//       const response = await fetch(`/api/calendar?interviewer_id=${interviewer_id}`, {
//         headers: {
//           'Authorization': `Bearer ${jwtToken}`,
//           'Accept': 'application/json'
//         }
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch interviews');
//       }
      
//       const data = await response.json();
      
//       if (!data.meetings || data.meetings.length === 0) {
//         setInterviews([]);
//       } else {
//         setInterviews(data.meetings);
//       }
      
//       setLoading(false);
      
//     } catch (error) {
//       setError(`${error.message}. Please try again later or contact support.`);
//       setLoading(false);
//     }
//   };

//   // Join meeting function
//   const joinMeeting = (meetingId) => {
//     window.location.href = `/room/${meetingId}`;
//   };

//   // Reschedule function
//   const reschedule = (meetingId) => {
//     // Implement your reschedule functionality here
//     alert("Reschedule functionality coming soon for meeting: " + meetingId);
//   };

//   // Check for JWT token and redirect if not present
//   useEffect(() => {
//     const jwtToken = getCookie('jwtToken');
//     if (!jwtToken) {
//       window.location.href = '/login';
//       return;
//     }
//     fetchInterviews();
//   }, []);

//   return (
//     <div className="app-container">
//       <div className="header">
//         <div className="header-content">
//           <h1>
//             <span className="header-icon">📅</span>
//             Upcoming Interviews
//           </h1>
//           <div className="header-subtitle">Manage your scheduled interviews</div>
//         </div>
//         <div className="header-decoration"></div>
//       </div>
      
//       <nav className="nav">
//         <div className="nav-container">
//           <div className="nav-links">
//             <a href="/dashboard" className="nav-link">
//               <span className="nav-icon">🏠</span>
//               Dashboard
//             </a>
//             <a href="#" className="nav-link active">
//               <span className="nav-icon">📋</span>
//               Interviews
//             </a>
//             <a href="#" className="nav-link">
//               <span className="nav-icon">👥</span>
//               Candidates
//             </a>
//             <a href="#" className="nav-link">
//               <span className="nav-icon">⚙️</span>
//               Settings
//             </a>
//             <a href="/logout" className="nav-link logout">
//               <span className="nav-icon">🚪</span>
//               Logout
//             </a>
//           </div>
//           <button 
//             className="mobile-menu-toggle"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//           >
//             ☰
//           </button>
//         </div>
        
//         {mobileMenuOpen && (
//           <div className="mobile-menu">
//             <a href="/dashboard" className="mobile-nav-link">🏠 Dashboard</a>
//             <a href="#" className="mobile-nav-link active">📋 Interviews</a>
//             <a href="#" className="mobile-nav-link">👥 Candidates</a>
//             <a href="#" className="mobile-nav-link">⚙️ Settings</a>
//             <a href="/logout" className="mobile-nav-link logout">🚪 Logout</a>
//           </div>
//         )}
//       </nav>
      
//       <div className="main">
//         <div className="interview-container">
//           <div className="container-header">
//             <h2>Your Scheduled Interviews</h2>
//             <div className="interview-stats">
//               {!loading && !error && (
//                 <span className="interview-count">
//                   {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
//                 </span>
//               )}
//             </div>
//           </div>
          
//           <div id="interviews-content">
//             {loading && (
//               <div className="loading">
//                 <div className="spinner-container">
//                   <div className="spinner"></div>
//                   <p>Loading your interviews...</p>
//                 </div>
//               </div>
//             )}
            
//             {error && (
//               <div className="error-message">
//                 <div className="error-icon">⚠️</div>
//                 <p>{error}</p>
//               </div>
//             )}
            
//             {!loading && !error && interviews.length === 0 && (
//               <div className="no-interviews">
//                 <div className="empty-state">
//                   <div className="empty-icon">📅</div>
//                   <h3>No interviews scheduled</h3>
//                   <p>You have no upcoming interviews at this time.</p>
//                 </div>
//               </div>
//             )}
            
//             {!loading && !error && interviews.length > 0 && (
//               <div className="interview-list">
//                 {interviews.map((meeting, index) => (
//                   <div key={index} className="interview-card">
//                     <div className="card-header">
//                       <div className="candidate-info">
//                         <div className="candidate-avatar">
//                           {meeting.candidate_email.charAt(0).toUpperCase()}
//                         </div>
//                         <div className="candidate-details">
//                           <h3>Interview with {meeting.candidate_email.split('@')[0]}</h3>
//                           <p className="candidate-email">{meeting.candidate_email}</p>
//                         </div>
//                       </div>
//                       <div className="status-badge">
//                         <span className={`status ${meeting.status.toLowerCase()}`}>
//                           {meeting.status}
//                         </span>
//                       </div>
//                     </div>
                    
//                     <div className="card-body">
//                       <div className="time-info">
//                         <div className="time-primary">
//                           <span className="time-icon">🕒</span>
//                           {formatDateTime(meeting.time)}
//                         </div>
//                         <div className="time-until">
//                           {getTimeUntil(meeting.time)}
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="card-footer">
//                       <div className="meeting-actions">
//                         <button 
//                           className="btn btn-primary"
//                           onClick={() => joinMeeting(meeting.meeting_id)}
//                         >
//                           <span className="btn-icon">🎥</span>
//                           Join Meeting
//                         </button>
//                         <button 
//                           className="btn btn-secondary"
//                           onClick={() => reschedule(meeting.meeting_id)}
//                         >
//                           <span className="btn-icon">📅</span>
//                           Reschedule
//                         </button>
//                       </div>
//                     </div>
                    
//                     <div className="card-decoration"></div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       <footer>
//         <div className="footer-content">
//           <p>&copy; 2025 Xynq. All rights reserved.</p>
//           <div className="footer-links">
//             <a href="#">Privacy</a>
//             <a href="#">Terms</a>
//             <a href="#">Support</a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Calendar;


import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Function to retrieve JWT token from cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Get interviewer email from JWT token
  const getInterviewerEmail = () => {
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) return null;
    
    try {
      // Decode the JWT payload
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));
      return payload.email;
    } catch (e) {
      console.error("Error decoding JWT token:", e);
      return null;
    }
  };

  // Format date for better display
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get time until interview
  const getTimeUntil = (dateTimeStr) => {
    const now = new Date();
    const interviewTime = new Date(dateTimeStr);
    const diff = interviewTime - now;
    
    if (diff < 0) return 'Past';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  // Fetch interviewer ID using email
  const fetchInterviewerId = (email) => {
    return fetch(`/api/interviewer?email=${encodeURIComponent(email)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch interviewer ID');
        }
        return response.json();
      })
      .then(data => {
        return data.interviewer_id;
      });
  };

  // Fetch and display interviews
  const fetchInterviews = async () => {
    const jwtToken = getCookie('jwtToken');
    
    if (!jwtToken) {
      window.location.href = '/login';
      return;
    }
    
    const interviewerEmail = getInterviewerEmail();
    if (!interviewerEmail) {
      setError('Unable to retrieve your email from the login token. Please try logging in again.');
      setLoading(false);
      return;
    }
    
    try {
      // Get interviewer ID from email
      const interviewer_id = await fetchInterviewerId(interviewerEmail);
      
      if (!interviewer_id) {
        setError('Unable to find an interviewer account for your email. Please contact support.');
        setLoading(false);
        return;
      }
      
      // Fetch interviews using interviewer ID
      const response = await fetch(`/api/calendar?interviewer_id=${interviewer_id}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }
      
      const data = await response.json();
      
      if (!data.meetings || data.meetings.length === 0) {
        setInterviews([]);
      } else {
        setInterviews(data.meetings);
      }
      
      setLoading(false);
      
    } catch (error) {
      setError(`${error.message}. Please try again later or contact support.`);
      setLoading(false);
    }
  };

  // Join meeting function
  const joinMeeting = (meetingId) => {
    window.location.href = `/room/${meetingId}`;
  };

  // Reschedule function
  const reschedule = (meetingId) => {
    // Implement your reschedule functionality here
    alert("Reschedule functionality coming soon for meeting: " + meetingId);
  };

  // Check for JWT token and redirect if not present
  useEffect(() => {
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) {
      window.location.href = '/login';
      return;
    }
    fetchInterviews();
  }, []);

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">InterviewHub</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </a>
          <a href="#" className="nav-item active">
            <span className="nav-icon">📋</span>
            <span className="nav-text">Interviews</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">👥</span>
            <span className="nav-text">Candidates</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Analytics</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </a>
          <a href="/logout" className="nav-item logout">
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </a>
        </nav>
      </div>

      <div className="main-content">
        <header className="top-header">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                <span className="title-icon">📅</span>
                Upcoming Interviews
              </h1>
              <p className="page-subtitle">Manage your scheduled interviews</p>
            </div>
            
            <div className="header-right">
              <div className="header-stats">
                {!loading && !error && (
                  <div className="stat-card">
                    <span className="stat-number">{interviews.length}</span>
                    <span className="stat-label">Interview{interviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="content-wrapper">
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                </div>
                <p className="loading-text">Loading your interviews...</p>
              </div>
            )}
            
            {error && (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <button className="retry-btn" onClick={fetchInterviews}>
                  Try Again
                </button>
              </div>
            )}
            
            {!loading && !error && interviews.length === 0 && (
              <div className="empty-state">
                <div className="empty-illustration">
                  <div className="empty-calendar">
                    <div className="calendar-header"></div>
                    <div className="calendar-grid">
                      {[...Array(35)].map((_, i) => (
                        <div key={i} className="calendar-cell"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <h3>No interviews scheduled</h3>
                <p>You have no upcoming interviews at this time. New interviews will appear here once scheduled.</p>
                <button className="cta-button">
                  <span>📧</span>
                  Check Email for Updates
                </button>
              </div>
            )}
            
            {!loading && !error && interviews.length > 0 && (
              <div className="interviews-grid">
                {interviews.map((meeting, index) => (
                  <div key={index} className="interview-card">
                    <div className="card-header">
                      <div className="candidate-section">
                        <div className="candidate-avatar">
                          <span>{meeting.candidate_email.charAt(0).toUpperCase()}</span>
                          <div className="avatar-ring"></div>
                        </div>
                        <div className="candidate-info">
                          <h3 className="candidate-name">
                            {meeting.candidate_email.split('@')[0]}
                          </h3>
                          <p className="candidate-email">{meeting.candidate_email}</p>
                        </div>
                      </div>
                      
                      <div className="status-section">
                        <span className={`status-badge ${meeting.status.toLowerCase()}`}>
                          <span className="status-dot"></span>
                          {meeting.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="time-section">
                        <div className="time-main">
                          <span className="time-icon">🕒</span>
                          <div className="time-details">
                            <span className="time-date">{formatDateTime(meeting.time)}</span>
                            <span className="time-until">{getTimeUntil(meeting.time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => joinMeeting(meeting.meeting_id)}
                      >
                        <span className="btn-icon">🎥</span>
                        Join Meeting
                      </button>
                      <button 
                        className="action-btn secondary"
                        onClick={() => reschedule(meeting.meeting_id)}
                      >
                        <span className="btn-icon">📅</span>
                        Reschedule
                      </button>
                    </div>
                    
                    <div className="card-gradient"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-header">
              <div className="logo">
                <span className="logo-icon">🎯</span>
                <span className="logo-text">InterviewHub</span>
              </div>
              <button 
                className="close-mobile-menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="mobile-nav">
              <a href="/dashboard" className="mobile-nav-item">
                <span className="nav-icon">🏠</span>
                Dashboard
              </a>
              <a href="#" className="mobile-nav-item active">
                <span className="nav-icon">📋</span>
                Interviews
              </a>
              <a href="#" className="mobile-nav-item">
                <span className="nav-icon">👥</span>
                Candidates
              </a>
              <a href="#" className="mobile-nav-item">
                <span className="nav-icon">📊</span>
                Analytics
              </a>
              <a href="#" className="mobile-nav-item">
                <span className="nav-icon">⚙️</span>
                Settings
              </a>
              <a href="/logout" className="mobile-nav-item logout">
                <span className="nav-icon">🚪</span>
                Logout
              </a>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;