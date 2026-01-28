'use client';

import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc,
  deleteDoc,
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
let localStream: MediaStream | null = null;

const getPeerConnection = () => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(servers);
  }
  return peerConnection;
};

const closePeerConnection = () => {
    if (peerConnection) {
        const pc = peerConnection;
        peerConnection = null; 
        
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;

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
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        pc.close();
    }
}

export const initiateShare = async (
  firestore: Firestore,
  stream: MediaStream,
  receiverId: string,
  sharerDeviceName: string,
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
): Promise<void> => {
  
  closePeerConnection();
  const pc = getPeerConnection();
  localStream = stream;

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  const receiverRef = doc(firestore, 'receivers', receiverId);
  const callerCandidates = collection(receiverRef, 'callerCandidates');

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(callerCandidates, event.candidate.toJSON()).catch(e => {
        const err = new FirestorePermissionError({
            path: callerCandidates.path,
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
  
  await updateDoc(receiverRef, { offer, status: 'connecting', sharerDeviceName }).catch(e => {
    const err = new FirestorePermissionError({
        path: receiverRef.path,
        operation: 'update',
        requestResourceData: { offer, status: 'connecting', sharerDeviceName },
    });
    errorEmitter.emit('permission-error', err);
  });

  const unsubscribe = onSnapshot(receiverRef, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
    if (data?.status === 'disconnected' || data?.status === 'failed') {
        hangUp(firestore, receiverId);
        unsubscribe();
    }
  });

  const calleeCandidates = collection(receiverRef, 'calleeCandidates');
  onSnapshot(calleeCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
};

export const hangUp = async (firestore: Firestore, receiverId: string | null, isReceiver?: boolean) => {
    closePeerConnection();
    if (receiverId) {
        const receiverRef = doc(firestore, 'receivers', receiverId);
        const docSnap = await getDoc(receiverRef);
        if (docSnap.exists()) {
           if (isReceiver) {
              await deleteDoc(receiverRef).catch(e => {
                const err = new FirestorePermissionError({
                    path: receiverRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', err);
              });
           } else {
            await updateDoc(receiverRef, { status: 'available', offer: null, answer: null, sharerDeviceName: null }).catch(e => {
                  const err = new FirestorePermissionError({
                      path: receiverRef.path,
                      operation: 'update',
                      requestResourceData: { status: 'available', offer: null, answer: null, sharerDeviceName: null },
                  });
                  errorEmitter.emit('permission-error', err);
            });
           }
        }
    }
};

export const answerShare = async (
    firestore: Firestore,
    receiverId: string,
    remoteVideo: HTMLVideoElement | null,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
) => {
    closePeerConnection();
    const pc = getPeerConnection();

    pc.ontrack = (event) => {
        if (remoteVideo) {
            if (!remoteVideo.srcObject) {
                remoteVideo.srcObject = new MediaStream();
            }
            event.streams[0].getTracks().forEach(track => {
                (remoteVideo.srcObject as MediaStream).addTrack(track);
            });
        }
    };


    const receiverRef = doc(firestore, 'receivers', receiverId);
    const calleeCandidates = collection(receiverRef, 'calleeCandidates');
    const callerCandidates = collection(receiverRef, 'callerCandidates');

    pc.onicecandidate = (event) => {
        event.candidate && addDoc(calleeCandidates, event.candidate.toJSON()).catch(e => {
            const err = new FirestorePermissionError({
                path: calleeCandidates.path,
                operation: 'create',
                requestResourceData: event.candidate?.toJSON(),
            });
            errorEmitter.emit('permission-error', err);
        });
    };

     pc.onconnectionstatechange = () => {
        onConnectionStateChange(pc.connectionState);
    }

    const callData = (await getDoc(receiverRef)).data();
    if (!callData || !callData.offer) {
        console.error("Receiver document or offer not found!");
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

    await updateDoc(receiverRef, { answer, status: 'connected' }).catch(e => {
        const err = new FirestorePermissionError({
            path: receiverRef.path,
            operation: 'update',
            requestResourceData: { answer, status: 'connected' },
        });
        errorEmitter.emit('permission-error', err);
    });

    onSnapshot(callerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                let data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
            }
        });
    });

     const unsubscribe = onSnapshot(receiverRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'disconnected' || data?.status === 'failed') {
            hangUp(firestore, receiverId);
            unsubscribe();
        }
    });
}
