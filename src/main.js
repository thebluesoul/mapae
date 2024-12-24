document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentContainer = document.getElementById('content-container');

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            menuItems.forEach(menu => menu.classList.remove('active'));
            item.classList.add('active');

            const targetContent = item.getAttribute('data-content');
            loadContent(targetContent);
        });
    });

    // Default active menu
    // 웹페이지 최초 로드시에 첫번째 메뉴(클라이언트 인증서 발행) 클릭 이벤트 발생.
    menuItems[0].click();
});

function loadContent(content) {
    let htmlFile = '';
    let jsFile = '';

    switch(content) {
        case 'server-info':
            htmlFile = 'public/server_info/server_info.html';
            jsFile = 'public/server_info/server_info.js';
            break;

        case 'revoke-cert':
            htmlFile = 'public/cert_revoke/cert_revoke.html';
            jsFile = 'public/cert_revoke/cert_revoke.js';
            break;

        case 'client-cert':
            htmlFile = 'public/cwp_cert/client.html';
            jsFile = 'public/cwp_cert/client.js';
            break;

        case 'server-cert':
            htmlFile = 'public/server_cert/server.html';
            jsFile = 'public/server_cert/server.js';
            break;

        case 'sign-cert':
            htmlFile = 'public/sign_cert/signer.html';
            jsFile = 'public/sign_cert/signer.js';
            break;

        case 'crl-info':
            htmlFile = 'public/crl_info/crl_info.html';
            jsFile = 'public/crl_info/crl_info.js';
            break;

        case 'ocsp':
            htmlFile = 'public/ocsp/ocsp.html';
            jsFile = 'public/ocsp/ocsp.js';
            break;

        case 'root-csr':
            htmlFile = 'public/root_csr/root_csr.html';
            jsFile = 'public/root_csr/root_csr.js';
            break;

        case 'cert-parser':
            htmlFile = 'public/cert_parser/cert_parser.html';
            jsFile = 'public/cert_parser/cert_parser.js';
            break;

        default:
            htmlFile = '';
            jsFile = '';
    }

    if (htmlFile) {
        fetch(htmlFile)
        .then(response => response.text())
        .then(html => {
            document.getElementById('content-container').innerHTML = html;

            // 공통 스크립트 로드
            const commonScript = document.createElement('script');
            commonScript.src = 'public/js_common/common.js';
            commonScript.onload = function() {
                // 페이지별 스크립트 로드
                if (jsFile) {
                    const script = document.createElement('script');
                    script.src = jsFile;

                    // DOMContentLoaded 이벤트 대신 하는 초기화 함수
                    script.onload = function() {
                        if (typeof onMenuClick === 'function') {
                            onMenuClick();
                        }
                    };
                    document.body.appendChild(script);
                }
            };
            document.body.appendChild(commonScript);
        })
        .catch(error => console.error('Error loading content:', error));
    }
}
