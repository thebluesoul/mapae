function onMenuClick() {
    console.log("root 인증서 CSR 메뉴가 클릭되었습니다.");
    loadTemplate();
}

function addProfileCaConfigJson() {
    const profileName = document.getElementById('profileName').value;
    const usages = Array.from(document.querySelectorAll('input[name="usages"]:checked')).map(el => el.value);

    if (profileName === "" || usages.length === 0) {
        alert("Please enter a profile name and select at least one usage.");
        return;
    }

    const profile = {
        "usages": usages,
        "expiry": "8760h",
        "crl_url": "http://##CENTERPUBLICIP##/crl.pem",
        "ocsp_url": "http://##CENTERPUBLICIP##/ocsp"
    };

    const templateOutput = document.getElementById('template-output').textContent.trim();
    
    // JSON 데이터가 비어 있지 않은지 확인
    if (!templateOutput) {
        document.getElementById('result-caconfjson').textContent = JSON.stringify({ message: "Invalid JSON template. Please load the JSON template first." });
        return;
    }

    try {
        const jsonData = JSON.parse(templateOutput);

        if (!jsonData.signing || !jsonData.signing.profiles) {
            document.getElementById('result-caconfjson').textContent = JSON.stringify({ message: "Invalid JSON template. Please load the JSON template first." });
            return;
        }

        jsonData.signing.profiles[profileName] = profile;

        document.getElementById('template-output').textContent = JSON.stringify(jsonData, null, 2);
        document.getElementById('profileName').value = '';
        document.querySelectorAll('input[name="usages"]:checked').forEach(el => el.checked = false);
    } catch (error) {
        document.getElementById('result-caconfjson').textContent = JSON.stringify({ message: "Error parsing JSON template.", details: error.message });
    }
}

async function genCaConfigJson() {
    const templateOutput = document.getElementById('template-output');
    const jsonData = JSON.parse(templateOutput.textContent || '{}');

    if (!jsonData.signing || !jsonData.signing.profiles) {
        alert('Invalid JSON template. Please load the JSON template first.');
        return;
    }

    ca_conf_name='ca-config.json.update'

    try {
        const Request = {
            file: ca_conf_name,
            info: jsonData
        };

        const resp = await fetch(`/api/gen-ca-config-json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Request)
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            document.getElementById('template-output').textContent = `Error: ${errorText}`;
            throw new Error('Network response was not ok.(ERRMSG='+ errorText + ')');
        }

        const respData = await resp.json();
        document.getElementById('result-caconfjson').textContent = `File generate successfully.\nPath: ${respData.file}\n`;
        document.getElementById('output-caconfjson').textContent = respData.Data;
    } catch (error) {
        document.getElementById('result-caconfjson').textContent = `Error: ${error.message}`;
    }
}

async function loadCaConfigJson() {
    try {
        file_name='ca-config.json.default'

        const Request = {
            file: file_name,
            info: ""
        };

        const resp = await fetch(`/api/defaultConf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Request)
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            document.getElementById('info-output').textContent = `Error: ${errorText}`;
            throw new Error('Network response was not ok.(ERRMSG='+ errorText + ', file=' + Request.file + ')');
        }

        const respData = await resp.json();
        document.getElementById('info-output').textContent = `File loaded successfully:\nPath: ${respData.path}\n`;
        document.getElementById('template-output').textContent = JSON.stringify(respData.confData, null, 2);
    } catch (error) {
        document.getElementById('info-output').textContent = `Error: ${error.message}`;
    }
}

function toggleSanSection() {
    const sanContent = document.getElementById('sanContent');
    const sanToggleIcon = document.getElementById('sanToggleIcon');
    if (sanContent.style.display === 'none' || sanContent.style.display === '') {
        sanContent.style.display = 'block';
        sanToggleIcon.textContent = '-';
    } else {
        sanContent.style.display = 'none';
        sanToggleIcon.textContent = '+';
    }
}

function toggleCaConfSection() {
    const toggleContent = document.getElementById('caConfContent');
    const toggleIcon = document.getElementById('caConfToggleIcon');
    if (toggleContent.style.display === 'none' || toggleContent.style.display === '') {
        toggleContent.style.display = 'block';
        toggleIcon.textContent = '-';
    } else {
        toggleContent.style.display = 'none';
        toggleIcon.textContent = '+';
    }
}

document.getElementById('showPassword').addEventListener('click', function () {
    const passwordField = document.getElementById('pkcs12Password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        this.textContent = 'Hide Password';
    } else {
        passwordField.type = 'password';
        this.textContent = 'Show Password';
    }
});

async function generateCaCsrJson() {
    // Form values
    const commonName = document.getElementById('commonName').value;
    const countryName = document.getElementById('countryName').value;
    const stateName = document.getElementById('stateName').value;
    const localityName = document.getElementById('localityName').value;
    const organizationName = document.getElementById('organizationName').value;
    const organizationalUnitName = document.getElementById('organizationalUnitName').value;
    const keyAlgorithms = document.getElementById('keyAlgorithms').value;
    const keySize = document.getElementById('keySize').value;

    // Create JSON object
    const jsonData = {
        CN: commonName || "example localCA",
        key: {
            algo: keyAlgorithms || "rsa",
            size: parseInt(keySize) || 2048
        },
        names: [
            {
                C: countryName,
                ST: stateName,
                L: localityName,
                O: organizationName,
                OU: organizationalUnitName
            }
        ]
    };

    // Output the JSON to the console (or handle it as needed)
    // console.log(JSON.stringify(jsonData, null, 2));
    try {
        file_name='ca-csr.json.update'

        const rootSubject = {
            subject: jsonData,
            file: file_name
        };

        const resp = await fetch(`/api/root-csr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rootSubject)
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            document.getElementById('fileOutput').textContent = `Error: ${errorText}`;
            throw new Error('Network response was not ok.(ERRMSG='+ errorText + ')');
        }

        const respData = await resp.json();

        // Display file path and contents
        document.getElementById('fileOutput').textContent = `File saved successfully:\nPath: ${respData.path}\nContents:\n${respData.csrData}`;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('fileOutput').textContent = `Error: ${error.message}`;
    }

}

document.getElementById('geneCaCsrJson').addEventListener('click', generateCaCsrJson);
document.getElementById('LoadCaConfigJson').addEventListener('click', loadCaConfigJson);
document.getElementById('addProfileCaConfigJson').addEventListener('click', addProfileCaConfigJson);
document.getElementById('genCaConfigJson').addEventListener('click', genCaConfigJson);
