// 메뉴 클릭 시 초기 설정 함수
function onMenuClick() {
    console.log("인증서 뷰어 메뉴가 클릭되었습니다.");

    // parseCertificate();
}

async function parseCertificate() {
    const forge = window.forge;

    const certPemData = document.getElementById('certificate').value;
    const certFilePath = document.getElementById('certfile').value;

    console.log("certPemData=", certPemData);
    console.log("certFilePath=", certFilePath);

    try {
        const response = await fetch('/api/parsingcert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                certPemData: certPemData
            })
        });

        const certinfo = await response.json();
        const decoderOutput = document.getElementById('decoder-results');

        if (certinfo.success) {
            // decoderOutput.textContent = certinfo.result;
            decoderOutput.innerHTML = '<h3>Certificate Details</h3>' +
                                      '<pre>' + certinfo.result + '</pre>';
            decoderOutput.style.display = 'block';
        } else {
            console.error('Error parsing certificate:', certinfo.errors);
            alert('Failed to parse certificate');
        }
    } catch (error) {
        console.error('Error generating CRL:', error);
    }
}

document.getElementById('submit-button').addEventListener('click', parseCertificate);
