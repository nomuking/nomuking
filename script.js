// 개발자 도구 및 복사 방지 로직
document.addEventListener('contextmenu', event => event.preventDefault());

let state = { 
    target: '', isPeerPowerful: null, 
    actionCategory: '', deepAnswers: [], frequency: '', isMulti: null, pain: '' 
};

let currentDeepIndex = 0;

const deepQuestions = {
    verbal: [
        { q: "폭언이나 모욕이 주로 어떤 상황에서 발생했나요?", opts: ["다수의 동료가 보는 앞이나 단체 채팅방에서", "밀실이나 단둘이 있는 상황에서", "업무 피드백을 빙자한 상황에서"] },
        { q: "발언의 수위나 주된 내용은 무엇이었나요?", opts: ["가족 욕설, 심각한 인신공격 및 명예훼손", "외모, 성별 등에 대한 차별적 비하", "업무 능력을 과도하게 깎아내리는 멸시"] },
        { q: "이러한 언행에 대한 사내 분위기는 어떠한가요?", opts: ["가해자의 습관적 행동이라 다들 묵인함", "유독 나에게만 심하게 표적을 맞춤", "조직 내에서 관행처럼 일어남"] }
    ],
    bullying: [
        { q: "따돌림이나 배제의 구체적인 방식은 어땠나요?", opts: ["회의나 업무 공유에서 의도적으로 배제함", "없는 사람(투명인간) 취급하며 대화를 피함", "나에 대한 악의적인 소문이나 험담을 유포함"] },
        { q: "이로 인해 업무 수행에 어떤 영향을 받았나요?", opts: ["협업이 단절되어 정상적인 업무 자체가 불가능함", "주변의 시선 때문에 심리적으로 극도로 위축됨", "다른 동료들마저 동조하여 완전히 고립됨"] },
        { q: "사측이나 관리자는 이 상황을 어떻게 대하고 있나요?", opts: ["관리자가 오히려 주도하거나 방관하고 있음", "알고도 묵인하며 아무런 조치를 취하지 않음", "아직 관리자나 사측에 공식적으로 알리지 않음"] }
    ],
    private: [
        { q: "어떤 종류의 사적 지시를 받았나요?", opts: ["커피, 담배, 세탁물 등 개인적인 심부름", "가족 행사나 개인 대소사에 강제 동원", "내 의사와 무관한 사적인 모임이나 회식 강요"] },
        { q: "이를 거절했을 때 어떤 반응이 돌아왔나요?", opts: ["인사고과, 해고 등을 언급하며 직접 협박함", "대놓고 눈치를 주거나 다른 업무로 괴롭힘", "거절을 꺼내기조차 힘든 강압적 분위기임"] },
        { q: "이러한 지시가 본래 업무와 조금이라도 관련이 있습니까?", opts: ["근로계약 및 내 업무와 전혀 무관함", "관련은 없으나 회사 내 관행처럼 포장됨", "애매하지만 사적인 비중이 훨씬 큼"] }
    ],
    control: [
        { q: "부당한 통제의 구체적인 형태는 무엇인가요?", opts: ["아무 일도 주지 않고 가만히 있게 방치함", "나의 능력/직급과 무관한 허드렛일만 강요함", "퇴근 후나 주말에 과도하게 연락하여 통제함"] },
        { q: "휴가나 병가 등을 사용할 때 어떤 제약이 있었나요?", opts: ["명시적으로 거부하거나 사직서를 쓰라고 압박함", "승인은 해주나 사유를 캐묻고 극심하게 눈치를 줌", "사용 후 평가나 부서 배치에서 불이익을 줌"] },
        { q: "당신의 업무를 감시하는 방식은 어땠나요?", opts: ["CCTV나 메신저를 통해 일거수일투족을 감시함", "화장실 가는 횟수나 자리 비움까지 통제함", "물리적으로 불가능한 과도한 실적/시간 압박을 줌"] }
    ],
    physical: [
        { q: "어떤 형태의 물리적 위협이 있었나요?", opts: ["직접적인 신체 폭행이나 밀치는 행위", "나를 향해 서류나 사무용품 등을 던짐", "책상을 크게 내리치는 등 심각한 위협적 태도"] },
        { q: "이 행위로 인해 상해나 파손이 발생했나요?", opts: ["실제 상해를 입어 병원 치료를 받았음", "개인 물품이나 사무용품이 파손되었음", "다행히 다치거나 부서지지는 않았음"] },
        { q: "당시 상황을 목격한 사람이 있습니까?", opts: ["다수의 동료나 고객이 있는 공개된 장소였음", "일부 동료가 목격했거나 소리를 들었음", "단둘이 있는 밀실에서 발생해 목격자가 없음"] }
    ]
};

function triggerLoading(msg, duration, callback) {
    document.getElementById('loading-msg').innerText = msg;
    document.getElementById('loading-screen').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        callback();
    }, duration);
}

// --- STAGE 1 ---
function selectTarget(target, btn) {
    clearSelection(btn.parentElement.querySelectorAll('.option-btn:not(.peer-opt)'));
    btn.classList.add('selected');
    state.target = target;
    
    document.getElementById('peer-question').style.display = 'none';
    document.getElementById('external-alert').style.display = 'none';
    document.getElementById('btn-next1').style.display = 'block';
    state.isPeerPowerful = null;

    if (target === 'peer') {
        document.getElementById('peer-question').style.display = 'block';
        document.getElementById('btn-next1').style.display = 'none'; 
    } else if (target === 'external') {
        document.getElementById('external-alert').style.display = 'block';
        document.getElementById('btn-next1').style.display = 'none'; 
    }
}

function setPeerPower(isPowerful, btn) {
    clearSelection(document.querySelectorAll('.peer-opt'));
    btn.classList.add('selected');
    state.isPeerPowerful = isPowerful;
    document.getElementById('btn-next1').style.display = 'block';
}

function goToStage2() {
    document.getElementById('stage1').classList.remove('active');
    document.getElementById('stage2').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- STAGE 2 ---
function startDeepDive(category, btn) {
    clearSelection(document.querySelectorAll('.st2-opt'));
    btn.classList.add('selected');
    
    state.actionCategory = category;
    state.deepAnswers = [];
    currentDeepIndex = 0;

    document.getElementById('category-selection').style.display = 'none';
    document.getElementById('deep-dive-section').style.display = 'block';
    
    renderDeepQuestion();
}

function renderDeepQuestion() {
    const qData = deepQuestions[state.actionCategory][currentDeepIndex];
    document.getElementById('deep-indicator').innerText = `심층 분석 (${currentDeepIndex + 1}/3)`;
    document.getElementById('deep-question-text').innerText = qData.q;
    
    const optsContainer = document.getElementById('deep-options');
    optsContainer.innerHTML = '';
    
    qData.opts.forEach((optText, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = optText;
        btn.onclick = function() { handleDeepAnswer(index, this); };
        optsContainer.appendChild(btn);
    });
}

function handleDeepAnswer(ansIndex, btn) {
    state.deepAnswers.push(ansIndex);
    currentDeepIndex++;

    if (currentDeepIndex < 3) {
        renderDeepQuestion();
    } else {
        document.getElementById('deep-dive-section').style.display = 'none';
        document.getElementById('frequency-section').style.display = 'block';
    }
}

function setFrequency(freq, btn) {
    clearSelection(document.querySelectorAll('.freq-opt'));
    btn.classList.add('selected');
    state.frequency = freq;
    document.getElementById('btn-next2').style.display = 'block';
}

function goToStage3() {
    document.getElementById('stage2').classList.remove('active');
    document.getElementById('stage3').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- STAGE 3 & Result ---
function setPain(pain, btn) {
    clearSelection(document.querySelectorAll('.st3-opt'));
    btn.classList.add('selected');
    state.pain = pain;
    document.getElementById('btn-submit').style.display = 'block';
}

function calculateResult() {
    let score = 0;
    let desc = "";
    let hasSuperiority = true; // 우위성 충족 여부 플래그

    // 1. 우위성 판단
    if (['employer', 'superior', 'senior', 'group'].includes(state.target)) {
        score += 30;
    } else if (state.target === 'peer' && state.isPeerPowerful) {
        score += 25; 
    } else if (state.target === 'peer' && !state.isPeerPowerful) {
        score += 0; 
        hasSuperiority = false; // 과락 트리거 발동
    }

    // 2. 행위 수위 및 지속성
    let deepSeverity = 0;
    state.deepAnswers.forEach(ans => {
        if(ans === 0) deepSeverity += 10;
        else if(ans === 1) deepSeverity += 7;
        else deepSeverity += 4;
    });

    let actionScore = 0;
    if (state.actionCategory === 'physical') {
        if (state.frequency === 'once') actionScore = (20 + deepSeverity); 
        else actionScore = 50;
    } else {
        if (state.frequency === 'once') actionScore = (10 + deepSeverity*0.5); 
        else if (state.frequency === 'sometimes') actionScore = (25 + deepSeverity*0.5);
        else actionScore = 50; 
    }
    score += actionScore;

    // 3. 고통 정도
    if (state.pain === 'severe_medical') score += 20;
    else if (state.pain === 'severe_quit') score += 16;
    else if (state.pain === 'moderate') score += 12;
    else score += 5;

    if (score > 100) score = 100;

    // 🚨 우위성 과락 로직 (Knock-out)
    if (!hasSuperiority) {
        score = Math.min(Math.round(score * 0.4), 45); 
    }

    // 결과 산출 문구
    if (!hasSuperiority) {
        desc = "<strong>근로기준법상 '직장 내 괴롭힘'으로 인정되기 매우 어렵습니다.</strong><br><br>";
        desc += "직장 내 괴롭힘이 법적으로 성립하려면 반드시 <strong>'지위 또는 관계의 우위'</strong>를 이용해야 합니다. 동급자나 후배이면서 사내 입지(우위성)가 명확하지 않다면 관할 노동청 진정 요건을 충족하기 어렵습니다.<br><br>";
        desc += "다만, 겪으신 행위의 수위에 따라 형법상 폭행, 모욕, 명예훼손이나 민사상 불법행위 책임을 물을 수 있으므로 다른 방향의 법적 대응을 검토하시기 바랍니다.";
    } else if (score >= 80) {
        desc = "<strong>직장 내 괴롭힘에 해당할 가능성이 매우 높습니다.</strong><br><br>";
        if (state.target === 'employer') {
            desc += "<span style='color:#E53E3E;'>※ 가해자가 '대표이사/등기이사'인 경우, 노동청 사실 인정 시 사업주에게 최대 1,000만 원의 과태료가 즉시 부과됩니다.</span><br><br>";
        }
        if (state.pain === 'severe_medical') {
            desc += "현재 병원 진료 기록이 있으시므로, 이는 노동청 진정 및 산재 신청 시 결정적인 증거로 활용될 수 있습니다.<br><br>";
        }
        desc += "객관적 증거(녹취, 메신저 캡처, 진료기록 등)를 바탕으로 전문가와 함께 법적 대응 전략을 논의하시길 권장합니다.";
    } else if (score >= 55) {
        desc = "<strong>직장 내 괴롭힘에 해당할 가능성이 상당합니다.</strong><br><br>";
        desc += "다만, 향후 대응 시 사측에서 '업무상 필요성'이나 '정당한 권한 행사'를 주장할 수 있습니다. 따라서 해당 행위가 부당함을 입증할 수 있는 기록(일지 등)을 꾸준히 남겨두십시오.";
    } else {
        desc = "<strong>직장 내 괴롭힘으로 인정받기에는 법적 다툼의 여지가 존재합니다.</strong><br><br>직장 내 갈등 요소는 확인되나, 법적인 객관적 요건(업무상 적정범위 초과 여부 등) 입증에서 다소 어려움이 예상됩니다. 사내 고충처리 절차를 먼저 밟아보시거나, 스트레스 완화를 위한 전문가 상담을 권장합니다.";
    }

    document.getElementById('btn-submit').style.display = 'none';
    document.getElementById('score').innerText = Math.round(score) + "%";
    document.getElementById('result-desc').innerHTML = desc;
    document.getElementById('final-result').style.display = 'block';
}

// --- 리셋 로직 ---
function resetTest() {
    state = { target: '', isPeerPowerful: null, actionCategory: '', deepAnswers: [], frequency: '', pain: '' };
    currentDeepIndex = 0;

    clearSelection(document.querySelectorAll('.option-btn'));

    document.getElementById('peer-question').style.display = 'none';
    document.getElementById('external-alert').style.display = 'none';
    document.getElementById('btn-next1').style.display = 'none';

    document.getElementById('category-selection').style.display = 'block';
    document.getElementById('deep-dive-section').style.display = 'none';
    document.getElementById('frequency-section').style.display = 'none';
    document.getElementById('btn-next2').style.display = 'none';

    document.getElementById('btn-submit').style.display = 'none';
    document.getElementById('final-result').style.display = 'none';

    document.querySelectorAll('.step-section').forEach(el => el.classList.remove('active'));
    document.getElementById('stage1').classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearSelection(elements) {
    elements.forEach(el => el.classList.remove('selected'));
}