/* ---------------------------------------------------------------
   Public Threat Detection — Frontend Logic
   --------------------------------------------------------------- */

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/alerts";

const videoFeed = document.getElementById("video-feed");
const noFeed = document.getElementById("no-feed");
const alertsList = document.getElementById("alerts-list");
const alertCount = document.getElementById("alert-count");

let ws = null;
let totalAlerts = 0;

// -------------------------------------------------------------------
// WebSocket connection
// -------------------------------------------------------------------

function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log("WebSocket connected");
        // Send periodic pings to keep the connection alive
        ws._pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send("ping");
            }
        }, 15000);
    };

    ws.onmessage = (event) => {
        try {
            const alert = JSON.parse(event.data);
            addAlertCard(alert);
        } catch (e) {
            console.error("Failed to parse alert:", e);
        }
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected — reconnecting in 3s");
        clearInterval(ws._pingInterval);
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
    };
}

// -------------------------------------------------------------------
// Alert rendering
// -------------------------------------------------------------------

function addAlertCard(alert) {
    // Remove empty state message if present
    const empty = alertsList.querySelector(".empty-state");
    if (empty) empty.remove();

    const card = document.createElement("div");
    let severityClass = "";
    if (alert.type === "WEAPON_DETECTED") severityClass = "";
    else if (alert.type === "UNUSUAL_GATHERING") severityClass = "warning";
    else severityClass = "medium";

    card.className = `alert-card ${severityClass}`;

    const typeLabel = alert.type.replace(/_/g, " ");
    const time = new Date(alert.timestamp).toLocaleTimeString();

    let detailsHtml = "";
    if (alert.details) {
        if (alert.details.object) {
            detailsHtml += `<span>Object: ${alert.details.object}</span> `;
        }
        if (alert.details.person_count) {
            detailsHtml += `<span>People: ${alert.details.person_count}</span> `;
        }
        if (alert.details.duration_seconds) {
            detailsHtml += `<span>Duration: ${alert.details.duration_seconds}s</span> `;
        }
    }

    card.innerHTML = `
        <div class="alert-type">${typeLabel}</div>
        <div class="alert-meta">${time} &mdash; ${alert.camera_id}</div>
        <div class="alert-confidence">Confidence: ${(alert.confidence * 100).toFixed(0)}% ${detailsHtml}</div>
    `;

    // Prepend so newest is on top
    alertsList.prepend(card);

    totalAlerts++;
    alertCount.textContent = totalAlerts;
}

// -------------------------------------------------------------------
// Video controls
// -------------------------------------------------------------------

async function startWebcam() {
    try {
        const res = await fetch(`${API_BASE}/video/webcam`, { method: "POST" });
        const data = await res.json();

        if (data.status === "ok") {
            showFeed();
        } else {
            alert("Could not open webcam. Make sure a camera is connected.");
        }
    } catch (err) {
        alert("Failed to connect to backend. Is the server running?");
        console.error(err);
    }
}

async function uploadVideo(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${API_BASE}/video/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();

        if (data.status === "ok") {
            showFeed();
        } else {
            alert("Upload failed.");
        }
    } catch (err) {
        alert("Failed to connect to backend. Is the server running?");
        console.error(err);
    }

    // Reset file input so the same file can be re-uploaded
    input.value = "";
}

function showFeed() {
    // Point the img tag at the MJPEG stream
    videoFeed.src = `${API_BASE}/video/stream`;
    noFeed.classList.add("hidden");
}

function stopFeed() {
    videoFeed.src = "";
    noFeed.classList.remove("hidden");
}

function clearAlerts() {
    alertsList.innerHTML = '<p class="empty-state">No alerts yet. Alerts will appear here in real time.</p>';
    totalAlerts = 0;
    alertCount.textContent = "0";
}

// -------------------------------------------------------------------
// Initialise
// -------------------------------------------------------------------

connectWebSocket();
