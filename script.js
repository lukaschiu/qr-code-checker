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
        resultsDiv.innerHTML = '<h2>Analyzing URL...</h2><h3>Please wait, this may take a few moments.</h3><div class="loader"></div>';
        
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

        // Display the initial results
        resultsDiv.innerHTML = `
            <h1>Scan Results</h1>
            <div class="result-content">
                <h4><strong>QR Code URL:</strong> ${decodedText || "N/A"}</h4>
                <div class="link-box">
                    <h3><strong>Status Message:</strong> ${data.status_message || "N/A"}</h3>
                    <h3><strong>Safety Score:</strong> ${data.safety_score || "N/A"}</h3>
                </div>
                <div id="additionalInfo" style="display: none;"></div>
            </div>
            <div class="flex-container">
                <button id="analysisButton" class="camera-button">Analysis</button>
                <button onclick="location.reload()" class="camera-button">Scan Again</button>
                <a href="${decodedText}" target="_blank">
                    <button class="camera-button">Open Link</button>
                </a>
            </div>
        `;

        // Add event listener for the Analysis button
        document.getElementById('analysisButton').addEventListener('click', () => {
            // Prepare the additional information as a list
            let percentagesList = '';
            if (data.percentages) {
                percentagesList = '<ul>' + Object.entries(data.percentages).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('') + '</ul>';
            } else {
                percentagesList = '<p>N/A</p>';
            }
            
            let rawStatsList = '';
            if (data.raw_stats) {
                rawStatsList = '<ul>' + Object.entries(data.raw_stats).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('') + '</ul>';
            } else {
                rawStatsList = '<p>N/A</p>';
            }
            
            // Display the additional information
            document.getElementById('additionalInfo').innerHTML = `
                <hr>
                <h2>Additional Details</h2>
                <div class="flex-container">
                    <div class="column">
                        <h3><strong>Percentages:</strong>${percentagesList}</h3>
                        <!--<h3><strong>Raw Stats:</strong>${rawStatsList}</h3>-->
                        <h3><strong>Total Scanners:</strong> ${data.total_scanners || "N/A"}</h3>
                        <h3><strong>Status:</strong> ${data.status || "N/A"}</h3>
                    </div>
                </div>
            `;
            document.getElementById('additionalInfo').style.display = 'block'; // Show the additional info
        });

    } catch (error) {
        console.error('Detailed error:', error);
        document.getElementById('scanResults').innerHTML = `
            <h2>Error</h2>
            <h3>There was an error analyzing the URL: ${error.message}</h3>
            <h3>Please check the console for more details.</h3>
            <button onclick="location.reload()" class="camera-button">Scan Again</button>
        `;
    }
}
