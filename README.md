# MAPAE(마패)
## 'MAPAE' 프로젝트는 cfssl 서버를 기반으로 인증서 발행을 테스트할 수 있는 웹 애플리케이션입니다. 

이 프로젝트는 JavaScript(68.9%), HTML(28.0%), CSS(3.1%)로 구성되어 있으며, 주요 파일로는 app.js, index.html, main.js, styles.css 등이 포함되어 있습니다. 

## Docker-compose 환경

Docker-compose환경에서 cfssl 를 실행하고 mysql 5.7과 연동하여 인증서 정보를 DB에 저장합니다.
이를 통해 사용자는 웹 인터페이스를 통해 cfssl 서버와 상호 작용하여 인증서를 발행하고 관리할 수 있습니다.

