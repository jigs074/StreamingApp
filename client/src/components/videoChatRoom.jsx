import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client';
import './videoChatRoom.css';

const ROOM_ID = window.ROOM_ID;
const USER_ID = window.USER_ID;

const VideoChatRoom = () => {
  const videoGridRef = useRef(null);
  const [myStream, setMyStream] = useState(null);
  const [myPeer, setMyPeer] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const peersRef = useRef({});
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io();
    const peer = new Peer();
    setMyPeer(peer);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setMyStream(stream);
        const videoEl = createVideoElement(stream, USER_ID, true);
        videoGridRef.current.appendChild(videoEl);
        updateGridLayout();

        peer.on('call', call => {
          call.answer(stream);
          call.on('stream', userStream => {
            const existing = document.querySelector(`[data-peer-id="${call.peer}"]`);
            if (!existing) {
              const remoteEl = createVideoElement(userStream, 'Remote User');
              remoteEl.dataset.peerId = call.peer;
              videoGridRef.current.appendChild(remoteEl);
              updateGridLayout();
            }
          });
        });

        socketRef.current.on('user-connected', userId => {
          const call = peer.call(userId, stream);
          call.on('stream', userStream => {
            const remoteEl = createVideoElement(userStream, userId);
            remoteEl.dataset.peerId = userId;
            videoGridRef.current.appendChild(remoteEl);
            updateGridLayout();
          });
          peersRef.current[userId] = call;
        });
      });

    socketRef.current.on('user-disconnected', userId => {
      if (peersRef.current[userId]) peersRef.current[userId].close();
      const vidEl = document.querySelector(`[data-peer-id="${userId}"]`);
      if (vidEl) vidEl.remove();
      updateGridLayout();
    });

    peer.on('open', id => {
      socketRef.current.emit('join-room', ROOM_ID, id);
    });

    return () => {
      if (myStream) myStream.getTracks().forEach(t => t.stop());
      peer.disconnect();
      socketRef.current.disconnect();
    };
  }, []);

  const updateGridLayout = () => {
    const grid = videoGridRef.current;
    const count = grid.children.length;
    setParticipantCount(count);
    grid.className = `video-grid participants-${count}`;
  };

  const createVideoElement = (stream, username, isLocal = false) => {
    const container = document.createElement('div');
    container.className = 'video-container';

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    if (isLocal) video.muted = true;

    const label = document.createElement('div');
    label.className = 'participant-name';
    label.innerHTML = `
      <div class="participant-avatar">${username.charAt(0).toUpperCase()}</div>
      <span class="participant-text">${username}</span>
    `;

    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'connection-status';

    container.appendChild(video);
    container.appendChild(label);
    container.appendChild(statusIndicator);

    container.addEventListener('dblclick', () => {
      document.querySelectorAll('.pinned').forEach(c => c.classList.remove('pinned'));
      container.classList.toggle('pinned');
      updateGridLayout();
    });

    return container;
  };

  const toggleMedia = (type) => {
    const track = type === 'video' ? myStream.getVideoTracks()[0] : myStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    
    if (type === 'video') {
      setIsVideoEnabled(track.enabled);
    } else {
      setIsAudioEnabled(track.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      if (isScreenSharing) {
        setIsScreenSharing(false);
        return;
      }
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenEl = createVideoElement(screenStream, 'My Screen');
      screenEl.classList.add('screen-share');
      videoGridRef.current.appendChild(screenEl);
      setIsScreenSharing(true);
      updateGridLayout();
      
      screenStream.getTracks()[0].onended = () => {
        screenEl.remove();
        setIsScreenSharing(false);
        updateGridLayout();
      };
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const leaveRoom = () => {
    if (myStream) myStream.getTracks().forEach(track => track.stop());
    window.location.href = '/';
  };

  return (
    <div className="main-container">
      <div className="header">
        <div className="room-info">
          <h2 className="room-title">Video Call</h2>
          <span className="participant-counter">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="room-actions">
          <button className="info-button" title="Room Info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="video-grid" ref={videoGridRef}></div>
      
      <div className="controls-container">
        <div className="controls">
          <button 
            className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}
            onClick={() => toggleMedia('video')}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              {isVideoEnabled ? (
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              ) : (
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l-3.28-3.28c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L20.41 19.41c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L21 17.5V6.5zM16 15L8 7h8v8z"/>
              )}
            </svg>
          </button>
          
          <button 
            className={`control-button ${!isAudioEnabled ? 'disabled' : ''}`}
            onClick={() => toggleMedia('audio')}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              {isAudioEnabled ? (
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              ) : (
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              )}
            </svg>
          </button>
          
          <button 
            className={`control-button ${isScreenSharing ? 'active' : ''}`}
            onClick={shareScreen}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
            </svg>
          </button>
          
          <button 
            className="control-button danger"
            onClick={leaveRoom}
            title="Leave call"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoChatRoom;