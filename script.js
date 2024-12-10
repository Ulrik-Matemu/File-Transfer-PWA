const fileInput = document.getElementById('file-input');
const sendButton = document.getElementById('send-button');
const receiveButton = document.getElementById('receive-button');
const qrCodeCanvas = document.getElementById('qr-code');
const connectionData = document.getElementById('connection-data');
const statusDiv = document.getElementById('status');

let peerConnection;
let dataChannel;

// Initialize WebRTC PeerConnection
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function logStatus(message) {
    statusDiv.textContent = message;
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            connectionData.value = JSON.stringify(peerConnection.localDescription);
        }
    };
}

async function setupSender() {
    createPeerConnection();
    dataChannel = peerConnection.createDataChannel('file-transfer');
    dataChannel.onopen = () => logStatus('Connection established. Ready to send.');

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    QRCode.toCanvas(qrCodeCanvas, JSON.stringify(offer), { width: 200 });
    qrCodeCanvas.hidden = false;
}

async function setupReceiver() {
    createPeerConnection();

    peerConnection.ondatachannel = event => {
        dataChannel = event.channel;
        dataChannel.onmessage = event => {
            const blob = new Blob([event.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'received-file';
            a.click();
        };
    };

    const answerData = JSON.parse(prompt('Enter connection data:'));
    await peerConnection.setRemoteDescription(answerData);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
}

sendButton.addEventListener('click', async () => {
    await setupSender();
});

receiveButton.addEventListener('click', async () => {
    await setupReceiver();
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && dataChannel) {
        dataChannel.send(file);
        logStatus('File sent!');
    }
});