'use strict';

function openURL(url, blank = false) {
    blank ? window.open(url, '_blank') : (window.location.href = url);
}

function IsSupportedWebRTC() {
    let isWebRTCSupported = false;
    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(function (item) {
        if (isWebRTCSupported) return;
        if (item in window) {
            isWebRTCSupported = true;
        }
    });
    return isWebRTCSupported;
}

function isMobile(userAgent) {
    return !!/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent || '');
}

function isTablet(userAgent) {
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
        userAgent,
    );
}

function isIpad(userAgent) {
    return /macintosh/.test(userAgent) && 'ontouchend' in document;
}

function isDesktop() {
    return !isMobileDevice && !isTabletDevice && !isIPadDevice;
}

function isFullScreen() {
    const elementFullScreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null;
    if (elementFullScreen === null) return false;
    return true;
}

function goInFullscreen(element) {
    if (element.requestFullscreen) element.requestFullscreen();
    else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
    else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    else if (element.msRequestFullscreen) element.msRequestFullscreen();
    else popupMessage('warning', 'Full screen', 'Full screen mode not supported by this browser on this device.');
}

function goOutFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
}

function copyRoom() {
    const tmpInput = document.createElement('input');
    document.body.appendChild(tmpInput);
    tmpInput.value = roomURL;
    tmpInput.select();
    tmpInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(tmpInput.value).then(() => {
        console.log('Copied to clipboard Join Link ', roomURL);
        document.body.removeChild(tmpInput);
        popupMessage(
            'clean',
            'Room sharing',
            `<div id="qrRoomContainer">
                <canvas id="qrRoom"></canvas>
            </div>
            <br/>
            <p style="color:rgb(8, 189, 89);">Join from your mobile device</p>
            <p style="background:transparent; color:white;">No need for apps, simply capture the QR code with your mobile camera Or Invite someone else to join by sending them the following URL</p>
            <p style="color:rgb(8, 189, 89);">${roomURL}</p>`,
        );
        makeRoomQR();
    });
}

async function shareRoom() {
    try {
        await navigator.share({ url: roomURL });
    } catch (err) {
        console.error('[Error] navigator share', err);
    }
}

function pasteAndSendMsg() {
    navigator.clipboard
        .readText()
        .then((text) => {
            const msg = sanitizeMsg(text);
            document.getElementsByClassName('swal2-textarea').value = msg;
            emitDcMsg(msg);
        })
        .catch((err) => {
            popupMessage('error', 'Clipboard', err);
        });
}

function copyToClipboard(text) {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            popupMessage('toast', 'Clipboard', 'Message copied!', 'top-end');
        })
        .catch((err) => {
            popupMessage('error', 'Clipboard', err);
        });
}

function handleBodyEvents() {
    checkElements();
    document.body.onmousemove = () => {
        if (buttonsBar.style.display == 'none' && waitingDivContainer.style.display == 'none') {
            toggleClassElements('videoHeader', true);
            elemDisplay(buttonsBar, true);
        }
    };
}

function checkElements() {
    if (buttonsBar.style.display != 'none') {
        toggleClassElements('videoHeader', false);
        elemDisplay(buttonsBar, false);
    }
    setTimeout(checkElements, 20000);
}

function toggleClassElements(className, displayState) {
    const elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
        elemDisplay(elements[i], displayState);
    }
}

function sanitizeMsg(text) {
    if (text.trim().length == 0) return;
    if (isHtml(text)) return sanitizeHtml(text);
    return text;
}

function isHtml(str) {
    const a = document.createElement('div');
    a.innerHTML = str;
    for (let c = a.childNodes, i = c.length; i--; ) {
        if (c[i].nodeType == 1) return true;
    }
    return false;
}

function sanitizeHtml(str) {
    const tagsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
    const replaceTag = (tag) => tagsToReplace[tag] || tag;
    const safe_tags_replace = (str) => str.replace(/[&<>]/g, replaceTag);
    return safe_tags_replace(str);
}

function startSessionTime() {
    const callStartTime = Date.now();
    setInterval(function printTime() {
        const callElapsedTime = Date.now() - callStartTime;
        sessionTime.innerHTML = getTimeToString(callElapsedTime);
    }, 1000);
}

function getTimeToString(time) {
    const diffInHrs = time / 3600000;
    const hh = Math.floor(diffInHrs);
    const diffInMin = (diffInHrs - hh) * 60;
    const mm = Math.floor(diffInMin);
    const diffInSec = (diffInMin - mm) * 60;
    const ss = Math.floor(diffInSec);
    const formattedHH = hh.toString().padStart(2, '0');
    const formattedMM = mm.toString().padStart(2, '0');
    const formattedSS = ss.toString().padStart(2, '0');
    return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

function elemDisplay(elem, show) {
    elem.style.display = show ? 'block' : 'none';
}

function makeRoomQR() {
    let qr = new QRious({
        element: document.getElementById('qrRoom'),
        value: roomURL,
    });
    qr.set({
        size: 256,
    });
}

async function playSound(name) {
    let sound = '../sounds/' + name + '.mp3';
    let audioToPlay = new Audio(sound);
    try {
        audioToPlay.volume = 0.5;
        await audioToPlay.play();
    } catch (err) {
        return false;
    }
}
