const html5QrCode = new Html5Qrcode("reader");
var cameraId;
function turnOnScan() {
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            cameraId = devices[0].id;
            html5QrCode.start(
                cameraId,
                {
                    fps: 5,
                    qrbox: { width: 150, height: 150 }
                },
                (decodedText, decodedResult) => {
                    //window.open(decodedText, '_blank').focus();
                    html5QrCode.pause(true);
                    setTimeout(function () {
                        html5QrCode.stop();
                        openInfo(decodedText);
                    }, 2000);

                    //
                    function fade(element) {
                        var op = 1;  // initial opacity
                        var timer = setInterval(function () {
                            if (op <= 0.1){
                                clearInterval(timer);
                                element.style.display = 'none';
                            }
                            element.style.opacity = op;
                            element.style.filter = 'alpha(opacity=' + op * 100 + ")";
                            op -= op * 0.1;
                        }, 50);
                    }
                },
                (errorMessage) => {

                })
                .catch((err) => {

                });

        }
    }).catch(err => {
        // handle err
    });
}

async function toggleButton() {
    const button = document.getElementById('cameraButton');
    button.textContent = "Start Scan";
    turnOnScan();
    setTimeout(function() {
        button.style.display = "none";;
    }, 1400);

}

async function openInfo(decodedText) {
    
}