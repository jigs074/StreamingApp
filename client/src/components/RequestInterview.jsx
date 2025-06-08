import React, { useEffect, useState } from 'react';
import './RequestInterview.css';

const RequestInterview = () => {
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [position, setPosition] = useState('');
  const [timeSlot1, setTimeSlot1] = useState('');
  const [timeSlot2, setTimeSlot2] = useState('');
  const [timeSlot3, setTimeSlot3] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const jwtToken = getCookie('jwtToken');
    if (!jwtToken) {
      alert('You must be logged in!');
      window.location.href = '/login';
      return;
    }

    const payload = JSON.parse(atob(jwtToken.split('.')[1]));
    setInterviewerEmail(payload.email);
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const jwtToken = getCookie('jwtToken');

    const data = {
      interviewerEmail,
      candidateEmail,
      position,
      timeSlots: [timeSlot1, timeSlot2, timeSlot3],
    };

    try {
      const response = await fetch('/request-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + jwtToken,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Interview request sent successfully!');
        window.location.href = '/dashboard';
      } else {
        alert(result.error || 'Something went wrong!');
      }
    } catch (error) {
      alert('Error sending request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="request-container">
        <div className="header-section">
          <div className="icon-wrapper">
            <svg className="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h2>Schedule Interview</h2>
          <p className="subtitle">Send an interview request with multiple time slots</p>
        </div>

        <form onSubmit={handleSubmit} className="interview-form">
          <div className="form-group">
            <label>
              <span className="label-text">Interviewer Email</span>
              <div className="input-wrapper readonly">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4Z"></path>
                  <path d="M22 2 11 13"></path>
                </svg>
                <input type="email" value={interviewerEmail} readOnly />
              </div>
            </label>
          </div>

          <div className="form-group">
            <label>
              <span className="label-text">Candidate Email</span>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  required
                />
              </div>
            </label>
          </div>

          <div className="form-group">
            <label>
              <span className="label-text">Position</span>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Software Engineer, Product Manager, etc."
                  required
                />
              </div>
            </label>
          </div>

          <div className="time-slots-section">
            <h3>Available Time Slots</h3>
            <p className="section-subtitle">Provide 3 preferred interview times</p>
            
            <div className="time-slots-grid">
              <div className="form-group">
                <label>
                  <span className="label-text">First Option</span>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <input
                      type="datetime-local"
                      value={timeSlot1}
                      onChange={(e) => setTimeSlot1(e.target.value)}
                      required
                    />
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label>
                  <span className="label-text">Second Option</span>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <input
                      type="datetime-local"
                      value={timeSlot2}
                      onChange={(e) => setTimeSlot2(e.target.value)}
                      required
                    />
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label>
                  <span className="label-text">Third Option</span>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <input
                      type="datetime-local"
                      value={timeSlot3}
                      onChange={(e) => setTimeSlot3(e.target.value)}
                      required
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Sending Request...
              </>
            ) : (
              <>
                <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
                Send Interview Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestInterview;