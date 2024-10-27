const html5QrCode = new Html5Qrcode("reader");
let devices;
var cameraId;
var i = 0;

function turnOnScan() {
    Html5Qrcode.getCameras().then(availableDevices => {
        devices = availableDevices;  // Store devices globally
        if (devices && devices.length) {
            cameraId = devices[i].id;
            html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 150, height: 150 }
                },
                (decodedText, decodedResult) => {
                    // Pause QR code scanning
                    html5QrCode.pause(true);
                    console.log("QR code scan successful");
                    setTimeout(function() {
                        html5QrCode.stop();
                        openInfo(decodedText);  // Call openInfo function with decoded URL
                    }, 1400);
                },
                (errorMessage) => {
                    // Error handling (optional)
                    console.error(errorMessage);
                }
            ).catch((err) => {
                console.error("Failed to start camera:", err);
            });
        }
    }).catch(err => {
        console.error("Error getting cameras:", err);
    });
}

async function toggleButton() {
    const button = document.getElementById('cameraButton');
    button.textContent = "Start Scan";
    turnOnScan();
    
    setTimeout(function() {
        button.style.display = "none";
    }, 1400);
}

function changeCamera() {
    html5QrCode.stop().then(() => {
        i = (i + 1) % devices.length;  // Cycle through available cameras
        html5QrCode.start(
            devices[i].id,
            {
                fps: 10,
                qrbox: { width: 150, height: 150 }
            },
            (decodedText, decodedResult) => {
                html5QrCode.pause(true);
                console.log("QR code scan successful");
                setTimeout(function() {
                    html5QrCode.stop();
                    openInfo(decodedText);  // Call openInfo function with decoded URL
                }, 1400);
            },
            (errorMessage) => {
                console.error(errorMessage);
            }
        ).catch((err) => {
            console.error("Failed to start camera:", err);
        });
    }).catch((err) => {
        console.error("Failed to stop camera:", err);
    });
}

async function openInfo(decodedText) {
    console.log("Starting URL analysis for: ", decodedText);
    
    try {
        // Show loading state
        const resultsDiv = document.getElementById('scanResults');
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = '<h2>Analyzing URL...</h2><p>Please wait, this may take a few moments.</p><div class="loader"></div>';
        
        // Log the request being sent
        console.log("Sending request to backend with URL:", decodedText);
        
        // Send URL to backend
        const response = await fetch('http://localhost:3000/scan', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ url: decodedText })
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText);
            throw new Error(`Server responded with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Received data from server:", data);

        // Display the results with the specified fields
        resultsDiv.innerHTML = `
            <h3>Scan Results</h3>
            <div class="result-content">
                <p><strong>Status Message:</strong> ${data.status_message || "N/A"}</p>
                <p><strong>Safety Score:</strong> ${data.safety_score || "N/A"}</p>
                <p><strong>Percentages:</strong> ${data.percentages ? JSON.stringify(data.percentages) : "N/A"}</p>
                <p><strong>Raw Stats:</strong> ${data.raw_stats ? JSON.stringify(data.raw_stats) : "N/A"}</p>
                <p><strong>Total Scanners:</strong> ${data.total_scanners || "N/A"}</p>
                <p><strong>Status:</strong> ${data.status || "N/A"}</p>
            </div>
            <button onclick="location.reload()" class="scan-again-button">Scan Again</button>
            <button onclick="openInNewTab('decodedText')" class="scan-again-button">Open Link</button>
        `;
        
    } catch (error) {
        console.error('Detailed error:', error);
        document.getElementById('scanResults').innerHTML = `
            <h2>Error</h2>
            <p>There was an error analyzing the URL: ${error.message}</p>
            <p>Please check the console for more details.</p>
            <button onclick="location.reload()" class="scan-again-button">Scan Again</button>
        `;
    }
}