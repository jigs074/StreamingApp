// const socket = io('/')
// const videoGrid = document.getElementById('video-grid')

// const myPeer = new Peer(undefined, {
//     host: '/', 
//     port: '3001'
// })

// const myVideo = document.createElement('video')
// myVideo.muted = true
// const peers = {}
// navigator.mediaDevices.getUserMedia({
//   video: true, 
//   audio: true 
// }).then(stream => {
//   addVideoStream(myVideo, stream)

//   myPeer.on('call', call => {
//     call.answer(stream)
//     const video = document.createElement('video')
//     call.on ('stream' , userVideoStream => {
//         addVideoStream(video, userVideoStream)
//     })
//   })

//   socket.on('user-connected', userId => {
//     connectToNewUser(userId, stream)
//   })

// }).catch(error => {
//   console.error('Failed to get local stream:', error)
// })

// socket.on('user-disconnected', userId => {
 
//     if (peers[userId]) 
//         peers[userId].close()


// })

// myPeer.on('open', id => {
//   socket.emit('join-room', ROOM_ID, id)
// })

// function addVideoStream(video, stream) {
//   video.srcObject = stream
//   video.addEventListener('loadedmetadata', () => {
//     video.play()
//   })
//   videoGrid.append(video)
// }

// function connectToNewUser(userId, stream) {
//   const call = myPeer.call(userId, stream)
//   const video = document.createElement('video')

//   call.on('stream', userVideoStream => {
//     addVideoStream(video, userVideoStream)
//   })
//   call.on('close', () => {
//     video.remove()
//   })

//   peers[userId] = call 
//   call.on('error', error => {
//     console.error('Call error:', error)
//   })
// }

const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
    host: '0.peerjs.com', 
    port: '443'
});


const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);

  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  });

  let isAudio = true;
  let isVideo = true;

  document.getElementById('toggle-mic').addEventListener('click', () => {
    isAudio = !isAudio;
    stream.getAudioTracks()[0].enabled = isAudio;
    document.getElementById('toggle-mic').src = isAudio ? "https://i.postimg.cc/R0cg5D1t/mic.png" : "https://i.postimg.cc/Bv5cXLwd/mute-mic.png";
  });

  document.getElementById('toggle-video').addEventListener('click', () => {
    isVideo = !isVideo;
    stream.getVideoTracks()[0].enabled = isVideo;
    document.getElementById('toggle-video').src = isVideo ? "https://i.postimg.cc/4xpdz6bP/video-icon-removebg-preview.png" : "https://i.postimg.cc/5NLkJ0SF/video-off.png";
  });

}).catch(error => {
  console.error('Failed to get local stream:', error);
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) {
    peers[userId].close();
  }
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');

  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
  call.on('error', error => {
    console.error('Call error:', error);
  });
}
