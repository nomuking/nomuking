document.addEventListener('contextmenu', event => event.preventDefault());

let state = { 
    target: '', isPeerPowerful: null, 
    actionCategory: '', deepAnswers: [], frequency: '', isMulti: null, 
    pain: [] // 3스테이지 복수 선택을 위한 배열
};

let summaryText = { st1: '선택 대기 중', st2: '선택 대기 중', st3: '선택 대기 중' };
let currentDeepIndex = 0;
let highestStageReached = 1;

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

function updateSidebarUI(activeStep) {
   .forEach(step => {
        let el = document.getElementById('sb-st' + step);
        el.classList.remove('active');
        if (step <= highestStageReached) el.classList.remove('locked');
        if (step === activeStep) el.classList.add('active');
        
        document.getElementById('sb-val' + step).innerText = summaryText['st' + step];
    });
}

function jumpToStage(step) {
    if (step > highestStageReached) return; 

    document.querySelectorAll('.step-section').forEach(el => el.style.display = 'none');
    document.getElementById('stage' + step).style.display = 'block';
    
    if (step === 3) {
        document.getElementById('stage3-content').style.display = 'block';
        document.getElementById('final-result').style.display = 'none';
    }

    updateSidebarUI(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- STAGE 1 ---
function selectTarget(target, textValue, btn) {
    clearSelection(document.querySelectorAll('.st1-opt'));
    btn.classList.add('selected');
    state.target = target;
    summaryText.st1 = textValue;
    updateSidebarUI(1);
    
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
    } else {
        highestStageReached = Math.max(highestStageReached, 2);
    }
}

function setPeerPower(isPowerful, textValue, btn) {
    clearSelection(document.querySelectorAll('.peer-opt'));
    btn.classList.add('selected');
    state.isPeerPowerful = isPowerful;
    summaryText.st1 = textValue;
    highestStageReached = Math.max(highestStageReached, 2);
    updateSidebarUI(1);
    document.getElementById('btn-next1').style.display = 'block';
}

// --- STAGE 2 ---
function startDeepDive(category, textValue, btn) {
    clearSelection(document.querySelectorAll('.st2-opt'));
    btn.classList.add('selected');
    state.actionCategory = category;
    summaryText.st2 = textValue; 
    updateSidebarUI(2);

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

function setFrequency(freq, textValue, btn) {
    clearSelection(document.querySelectorAll('.freq-opt'));
    btn.classList.add('selected');
    state.frequency = freq;
    
    summaryText.st2 = summaryText.st2.split(' / ') + ' / ' + textValue; 
    updateSidebarUI(2);

    document.getElementById('multi-question').style.display = 'block';
}

function setMulti(isMulti, textValue, btn) {
    clearSelection(document.querySelectorAll('.multi-opt'));
    btn.classList.add('selected');
    state.isMulti = isMulti;
    highestStageReached = Math.max(highestStageReached, 3);
    document.getElementById('btn-next2').style.display = 'block';
}

// --- STAGE 3 (복수 선택 로직) ---
function togglePain(painValue, textValue, btn) {
    const index = state.pain.indexOf(painValue);
    
    if (index > -1) {
        state.pain.splice(index, 1);
        btn.classList.remove('selected');
    } else {
        state.pain.push(painValue);
        btn.classList.add('selected');
    }

    if (state.pain.length > 0) {
        document.getElementById('btn-submit').style.display = 'block';
        summaryText.st3 = state.pain.length + "개 항목 선택";
    } else {
        document.getElementById('btn-submit').style.display = 'none';
        summaryText.st3 = "선택 대기 중";
    }
    updateSidebarUI(3);
}

// --- 최종 결과 계산 (과락 로직 반영) ---
function calculateResult() {
    document.getElementById('stage3-content').style.display = 'none';
    summaryText.st3 = "진단 완료";
    updateSidebarUI(3);

    let score = 50; 
    let desc = "";
    let hasSuperiority = true; 

    // [로직] 지위 우위성 체크
    if (['employer', 'superior', 'senior', 'group'].includes(state.target)) score += 20;
    else if (state.target === 'peer' && state.isPeerPowerful) score += 10;
    else if (state.target === 'peer' && !state.isPeerPowerful) hasSuperiority = false; 

    // [로직] 심층 질문 수위 합산
    let deepSeverity = 0;
    state.deepAnswers.forEach(ans => {
        if(ans === 0) deepSeverity += 5;
        else if(ans === 1) deepSeverity += 3;
    });
    score += deepSeverity;
    if (state.isMulti) score += 5;

    if (score > 100) score = 100;

    // 🚨 [과락 로직 적용]
    if (!hasSuperiority) {
        score = Math.min(score, 10);
    } 
    else if (state.frequency === 'once') {
        score = Math.min(score, 30);
    } 
    else if (state.pain.length === 1 && state.pain === 'mild') {
        score = Math.min(score, 45); 
    }

    // 결과 텍스트 분기
    if (score <= 10) {
        desc = "<strong>근로기준법상 '직장 내 괴롭힘'으로 인정받을 확률이 극히 희박합니다. (10% 이하)</strong><br><br>";
        desc += "법적 요건의 1순위인 <strong>'지위 또는 관계의 우위'</strong>가 결여되어 있습니다. 동급자나 후배이면서 사내 입지가 강하지 않다면 노동청 진정 대상이 되지 않습니다.<br>다만, 행위 수위에 따라 형법상 모욕, 폭행 등의 별도 대응을 검토하십시오.";
    } else if (score <= 30) {
        desc = "<strong>괴롭힘으로 인정받기에는 법적 요건이 많이 부족합니다. (30% 이하)</strong><br><br>";
        desc += "사건이 <strong>단발성(1회성)</strong>에 그친 경우, 객관적인 근무환경 악화를 입증하기 매우 어렵습니다. 사내 고충처리 위원회를 활용하여 일회성 갈등을 중재하는 것이 실무적으로 가장 유리합니다.";
    } else if (score <= 50) {
        desc = "<strong>법적 다툼의 여지가 크며, 인정 확률이 높지 않습니다. (50% 이하)</strong><br><br>";
        desc += "행위의 부당함이 있더라도 피해의 정도가 <strong>일상생활이 가능한 수준</strong>이라면, 노동청 조사 시 객관적인 피해 요건(근무환경 악화)에서 불인정 판정을 받을 리스크가 큽니다.";
    } else if (score >= 80) {
        desc = "<strong>직장 내 괴롭힘에 해당할 가능성이 매우 높습니다.</strong><br><br>";
        if (state.target === 'employer') desc += "<span style='color:#E53E3E;'>※ 가해자가 법적 사용자(대표/등기이사)이므로 노동청 인정 시 1,000만 원 이하의 과태료 대상입니다.</span><br><br>";
        if (state.pain.includes('severe_medical')) desc += "병원 진료 기록은 산재 신청 및 진정에 결정적 증거가 됩니다. 지금 즉시 관련 증거를 취합하여 전문가와 대응하십시오.";
    } else {
        desc = "<strong>직장 내 괴롭힘에 해당할 가능성이 상당합니다.</strong><br><br>";
        desc += "다만, 회사 측에서 '정당한 업무 지시였다'고 방어할 논리가 존재하므로, 해당 행위의 부당함을 입증할 구체적인 기록(일지, 메신저 등) 보완이 필수적입니다.";
    }

    document.getElementById('score').innerText = Math.round(score) + "%";
    document.getElementById('result-desc').innerHTML = desc;
    document.getElementById('final-result').style.display = 'block';
}

function resetTest() {
    state = { target: '', isPeerPowerful: null, actionCategory: '', deepAnswers: [], frequency: '', isMulti: null, pain: [] };
    summaryText = { st1: '선택 대기 중', st2: '선택 대기 중', st3: '선택 대기 중' };
    currentDeepIndex = 0;
    highestStageReached = 1;

    clearSelection(document.querySelectorAll('.option-btn'));

    document.getElementById('peer-question').style.display = 'none';
    document.getElementById('external-alert').style.display = 'none';
    document.getElementById('btn-next1').style.display = 'none';

    document.getElementById('category-selection').style.display = 'block';
    document.getElementById('deep-dive-section').style.display = 'none';
    document.getElementById('frequency-section').style.display = 'none';
    document.getElementById('multi-question').style.display = 'none';
    document.getElementById('btn-next2').style.display = 'none';

    document.getElementById('stage3-content').style.display = 'block';
    document.getElementById('btn-submit').style.display = 'none';
    document.getElementById('final-result').style.display = 'none';

    jumpToStage(1);
    updateSidebarUI(1);
}

function clearSelection(elements) {
    elements.forEach(el => el.classList.remove('selected'));
}