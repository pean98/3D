const firebaseConfig = {
    apiKey: "AIzaSyCr7lyScV9IZ0mwQpt2B2m8VeXtN42cNTk",
    authDomain: "access-log-c5550.firebaseapp.com",
    projectId: "access-log-c5550",
    storageBucket: "access-log-c5550.firebasestorage.app",
    messagingSenderId: "577728155008",
    appId: "1:577728155008:web:81015816ee85e7600b4565",
    measurementId: "G-Y2W72M9Q5H"
};
firebase.initializeApp(firebaseConfig);

// Firestore 초기화
const db = firebase.firestore();

// HTML 요소 선택
const entryForm = document.getElementById('entry-form');
const nameInput = document.getElementById('name-input');
const actionSelect = document.getElementById('action-select');
const safetyCheck = document.getElementById('safety-check');
const submitBtn = document.getElementById('submit-btn');
const logsTableBody = document.getElementById('logs-table-body');

// 출입 기록 저장 함수
function saveEntryLog() {
    const name = nameInput.value.trim();
    const action = actionSelect.value;
    const createdAt = new Date();

    if (action === "in" && !safetyCheck.checked) {
        alert("3D프린터 안전 교육을 이수해야 합니다.");
        return;
    }

    if (!name) {
        alert("이름을 입력하세요.");
        return;
    }

    if (action === "in") {
        db.collection('logs').add({
            name: name,
            action: "입장",
            createdAt: createdAt,
            exitedAt: null,
            safetyCheck: safetyCheck.checked
        }).then(() => {
            nameInput.value = '';
            safetyCheck.checked = false;
            loadLogs();
        });
    } else if (action === "out") {
        db.collection('logs')
            .where('name', '==', name)
            .where('exitedAt', '==', null)
            .get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    db.collection('logs').doc(doc.id).update({
                        exitedAt: createdAt
                    }).then(() => {
                        nameInput.value = '';
                        loadLogs();
                    });
                } else {
                    alert("현재 출입 중인 기록이 없습니다.");
                }
            });
    }
}

// 작성 시간 포맷 함수
function formatTime(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 실시간 출입 기록 불러오기
function loadLogs() {
    db.collection('logs').orderBy('createdAt', 'desc')
        .onSnapshot(querySnapshot => {
            logsTableBody.innerHTML = '';
            querySnapshot.forEach(doc => {
                const logData = doc.data();

                const exitedAt = logData.exitedAt ? formatTime(logData.exitedAt.toDate()) : '출입 중';
                const createdAt = formatTime(logData.createdAt.toDate());

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${logData.name}</td>
                    <td>${createdAt}</td>
                    <td>${exitedAt}</td>
                    <td>${logData.safetyCheck ? '이수' : '미이수'}</td>
                `;

                logsTableBody.appendChild(row);
            });
        });
}

// 행동 선택에 따라 체크박스 활성화 상태 변경
actionSelect.addEventListener('change', () => {
    if (actionSelect.value === "in") {
        safetyCheck.disabled = false;
    } else {
        safetyCheck.disabled = true;
        safetyCheck.checked = false; // 퇴장 시 체크박스 초기화
    }
});

// 이벤트 리스너 등록
submitBtn.addEventListener('click', saveEntryLog);

// 초기 로딩
loadLogs();
