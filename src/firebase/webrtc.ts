'use client';

import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc,
  Firestore,
  serverTimestamp
} from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection: RTCPeerConnection | null = null;

const getPeerConnection = () => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(servers);
  }
  return peerConnection;
};

const closePeerConnection = () => {
    if (peerConnection) {
        // Stop all tracks
        const pc = peerConnection;
        peerConnection = null; // Prevent re-entrancy
        pc.getSenders().forEach(sender => {
            if (sender.track) {
                sender.track.stop();
            }
        });
        pc.getReceivers().forEach(receiver => {
            if (receiver.track) {
                receiver.track.stop();
            }
        });
        pc.close();
    }
}


export const createOffer = async (
  firestore: Firestore,
  localStream: MediaStream,
  remoteVideo: HTMLVideoElement | null, // Not used for offerer, but kept for consistency
  deviceName: string,
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
): Promise<string> => {
  
  closePeerConnection(); // Ensure any existing connection is closed
  const pc = getPeerConnection();

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  const connectionsRef = collection(firestore, 'connections');
  const callDoc = doc(connectionsRef);
  const offerCandidates = collection(callDoc, 'callerCandidates');

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(offerCandidates, event.candidate.toJSON()).catch(e => {
        const err = new FirestorePermissionError({
            path: offerCandidates.path,
            operation: 'create',
            requestResourceData: event.candidate?.toJSON(),
        });
        errorEmitter.emit('permission-error', err);
      });
    }
  };

  pc.onconnectionstatechange = () => {
    onConnectionStateChange(pc.connectionState);
  }

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  const connectionData = { 
    offer, 
    status: 'offering', 
    initiatorName: deviceName,
    createdAt: serverTimestamp() 
  };
  await setDoc(callDoc, connectionData).catch(e => {
    const err = new FirestorePermissionError({
        path: callDoc.path,
        operation: 'create',
        requestResourceData: connectionData,
    });
    errorEmitter.emit('permission-error', err);
  });

  const unsubscribe = onSnapshot(callDoc, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
    if (data?.status === 'disconnected' || data?.status === 'failed') {
        hangUp(firestore, callDoc.id);
        unsubscribe();
    }
  });

  const answerCandidates = collection(callDoc, 'calleeCandidates');
  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  return callDoc.id;
};

export const hangUp = async (firestore: Firestore, connectionId: string | null) => {
    closePeerConnection();
    if (connectionId) {
        const callDoc = doc(firestore, 'connections', connectionId);
        const docSnap = await getDoc(callDoc);
        if (docSnap.exists() && docSnap.data().status !== 'disconnected') {
           await updateDoc(callDoc, { status: 'disconnected' }).catch(e => {
                const err = new FirestorePermissionError({
                    path: callDoc.path,
                    operation: 'update',
                    requestResourceData: { status: 'disconnected' },
                });
                errorEmitter.emit('permission-error', err);
           });
        }
    }
};

export const answerOffer = async (
    firestore: Firestore,
    connectionId: string,
    remoteVideo: HTMLVideoElement | null,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
) => {
    closePeerConnection(); // Ensure any existing connection is closed
    const pc = getPeerConnection();

    pc.ontrack = (event) => {
        if (remoteVideo) {
            // Assign the stream to the video element
            if (!remoteVideo.srcObject) {
                remoteVideo.srcObject = new MediaStream();
            }
            event.streams[0].getTracks().forEach(track => {
                (remoteVideo.srcObject as MediaStream).addTrack(track);
            });
        }
    };


    const callDoc = doc(firestore, 'connections', connectionId);
    const answerCandidates = collection(callDoc, 'calleeCandidates');
    const offerCandidates = collection(callDoc, 'callerCandidates');

    pc.onicecandidate = (event) => {
        event.candidate && addDoc(answerCandidates, event.candidate.toJSON()).catch(e => {
            const err = new FirestorePermissionError({
                path: answerCandidates.path,
                operation: 'create',
                requestResourceData: event.candidate?.toJSON(),
            });
            errorEmitter.emit('permission-error', err);
        });
    };

     pc.onconnectionstatechange = () => {
        onConnectionStateChange(pc.connectionState);
    }

    const callData = (await getDoc(callDoc)).data();
    if (!callData || !callData.offer) {
        console.error("Connection document or offer not found!");
        return;
    }
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer, status: 'connected' }).catch(e => {
        const err = new FirestorePermissionError({
            path: callDoc.path,
            operation: 'update',
            requestResourceData: { answer, status: 'connected' },
        });
        errorEmitter.emit('permission-error', err);
    });

    onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                let data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
            }
        });
    });

     const unsubscribe = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'disconnected' || data?.status === 'failed') {
            hangUp(firestore, callDoc.id);
            unsubscribe();
        }
    });
}
