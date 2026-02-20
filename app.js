// --- STATE ---
let currentState = {
    materials: [
        { id: 1, name: "ปูนซีเมนต์ (เสือ)", price: 145, location: "ไทวัสดุ พระราม 2" },
        { id: 2, name: "เหล็กกล่อง 1x1", price: 350, location: "Global House" }
    ],
    workflow: [
        { id: 1, step: "วัดพื้นที่และตีเส้น", date: "20 พ.ย.", status: "completed" },
        { id: 2, step: "ขุดหลุมลงเสาเข็ม", date: "21 พ.ย.", status: "completed" },
        { id: 3, step: "ขึ้นโครงเหล็กและเทปูน", date: "วันนี้", status: "active" },
        { id: 4, step: "ก่ออิฐ/ติดตะแกรงรั้ว", date: "รอดำเนินการ", status: "pending" },
        { id: 5, step: "ทาสีและเก็บงาน", date: "รอดำเนินการ", status: "pending" }
    ],
    timeLogs: [],
    timer: {
        isRunning: false,
        seconds: 0,
        interval: null,
        startTime: null
    },
    workers: [
        { id: 1, name: "สมชาย ใจดี", role: "หัวหน้าช่าง", wage: 600, isPresent: true, accumulatedWage: 1200, advancePayment: 500 },
        { id: 2, name: "สมหญิง รักงาน", role: "ช่างปูน", wage: 450, isPresent: true, accumulatedWage: 900, advancePayment: 0 },
        { id: 3, name: "บุญมี แข็งขัน", role: "ผู้ช่วยช่าง", wage: 350, isPresent: false, accumulatedWage: 700, advancePayment: 200 }
    ],
    compareResult: null
};

// --- DATA PERSISTENCE ---
const STORAGE_KEY = 'siteMasterData';

function saveStateToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
}

function loadStateFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge saved data with default structure to prevent missing fields
            currentState = { ...currentState, ...parsed };
            // Ensure timer structure is consistent after loading
            if (!currentState.timer.hasOwnProperty('isActive')) currentState.timer.isActive = false;
            if (!currentState.timer.hasOwnProperty('totalSeconds')) currentState.timer.totalSeconds = 0;
            if (!currentState.timer.hasOwnProperty('startTime')) currentState.timer.startTime = null;
        } catch (e) {
            console.error("Error loading data from localStorage", e);
        }
    }
}

// --- INIT ---
let timerInterval = null; // Global variable for timer interval

document.addEventListener("DOMContentLoaded", () => {
    // Current date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('th-TH', dateOptions);

    loadStateFromStorage();
    renderMaterials();
    renderWorkflow();
    renderTimeLogs();
    renderWorkers(); // Initial render for workers

    // Resume timer if active in state
    if (currentState.timer.isActive) {
        const now = Date.now();
        currentState.timer.totalSeconds += Math.floor((now - currentState.timer.startTime) / 1000);
        currentState.timer.startTime = now;
        timerInterval = setInterval(updateTimerDisplay, 1000);
        document.getElementById('timer-btn').innerHTML = "<i class='bx bx-pause-circle'></i> หยุดพัก";
        document.getElementById('timer-btn').classList.replace('btn-primary', 'btn-danger');
        document.getElementById('timer-status').textContent = 'กำลังทำงาน...';
        document.getElementById('timer-status').style.color = 'var(--success-color)';
    } else if (currentState.timer.totalSeconds > 0) {
        updateTimerDisplay();
        document.getElementById('timer-status').textContent = 'พักงาน';
        document.getElementById('timer-status').style.color = 'var(--warning-color)';
    }
});

// --- NAVIGATION ---
const pages = {
    home: "ภาพรวมงาน",
    materials: "รายการจัดซื้อ",
    workflow: "กระบวนการงาน",
    time: "ลงเวลาทำงาน",
    attendance: "เช็คชื่อทีมงาน",
    compare: "เปรียบเทียบราคา",
    estimate: "คำนวณวัสดุทำรั้ว"
};

function navigate(viewId, navElement = null) {
    // Update Views
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');

    // Update Header
    document.getElementById('page-title').textContent = pages[viewId];

    // Update Nav Icons
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    } else {
        // Fallback if navigated programmatically
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(viewId)) {
                el.classList.add('active');
            }
        });
    }

    if (viewId === 'estimate') renderEstimation();
}

// --- MATERIALS FUNCTIONALITY ---
function renderMaterials() {
    const list = document.getElementById('material-list');
    const searchTerm = (document.getElementById('search-materials')?.value || '').toLowerCase();
    list.innerHTML = '';

    let total = 0;
    const filteredMaterials = currentState.materials.filter(m => {
        return m.name.toLowerCase().includes(searchTerm) || m.location.toLowerCase().includes(searchTerm);
    });

    if (filteredMaterials.length === 0) {
        list.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 1rem;">ไม่พบรายการจัดซื้อ</p>`;
        return;
    }

    filteredMaterials.forEach(mat => {
        total += parseFloat(mat.price);
        let imgTag = mat.image ? `<img src="${mat.image}" style="max-width: 50px; max-height: 50px; border-radius: 4px; object-fit: cover;" alt="receipt">` : '';

        list.innerHTML += `
            <div class="flex-item-list">
                ${imgTag}
                <div class="item-details" style="flex: 1; margin-left: ${mat.image ? '0.5rem' : '0'};">
                    <h4>${mat.name}</h4>
                    <div class="item-meta">
                        <i class='bx bx-store-alt'></i> ${mat.location}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <div class="item-price">฿${mat.price.toLocaleString()}</div>
                    <button class="btn btn-icon" style="width:30px; height:30px; font-size:1rem; background: var(--warning-color);" onclick="editMaterial(${mat.id})"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-icon" style="width:30px; height:30px; font-size:1rem; background: var(--danger-color);" onclick="deleteMaterial(${mat.id})"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `;
    });

    if (currentState.materials.length > 0) {
        list.innerHTML += `
            <div class="flex-item-list" style="background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3);">
                <div class="item-details"><h4>ยอดรวมประมาณการ</h4></div>
                <div class="item-price">฿${total.toLocaleString()}</div>
            </div>
        `;
    } else {
        list.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top:2rem;">ยังไม่มีรายการ</p>`;
    }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    const inputs = document.getElementById(id).querySelectorAll('input');
    inputs.forEach(input => input.value = '');
}

let activeMaterialId = null;

function editMaterial(id) {
    activeMaterialId = id;
    const mat = currentState.materials.find(m => m.id === id);
    if (!mat) return;

    document.getElementById('mat-name').value = mat.name;
    document.getElementById('mat-price').value = mat.price;
    document.getElementById('mat-location').value = mat.location;
    document.getElementById('mat-image').value = ''; // Reset file input
    openModal('add-material-modal');
}

function deleteMaterial(id) {
    if (confirm("คุณต้องการลบรายการนี้ใช่ไหม?")) {
        currentState.materials = currentState.materials.filter(m => m.id !== id);
        saveStateToStorage();
        renderMaterials();
    }
}

async function addMaterial() {
    const name = document.getElementById('mat-name').value;
    const price = document.getElementById('mat-price').value;
    const location = document.getElementById('mat-location').value;
    const imageInput = document.getElementById('mat-image');

    if (!name) return alert("กรุณาใส่ชื่อรายการ");

    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
        try {
            imageData = await readAndCompressImage(imageInput.files[0]);
        } catch (e) {
            console.warn("Could not read image", e);
        }
    }

    if (activeMaterialId) {
        // Edit existing
        const mat = currentState.materials.find(m => m.id === activeMaterialId);
        if (mat) {
            mat.name = name;
            mat.price = price ? parseFloat(price) : 0;
            mat.location = location || "ไม่ระบุ";
            if (imageData) mat.image = imageData;
        }
        activeMaterialId = null;
    } else {
        // Add new
        currentState.materials.push({
            id: Date.now(),
            name,
            price: price ? parseFloat(price) : 0,
            location: location || "ไม่ระบุ",
            image: imageData
        });
    }

    saveStateToStorage();
    renderMaterials();
    closeModal('add-material-modal');
}

// --- WORKFLOW FUNCTIONALITY ---
function renderWorkflow() {
    const list = document.getElementById('workflow-list');
    const searchTerm = (document.getElementById('search-workflow')?.value || '').toLowerCase();
    const filterStatus = document.getElementById('filter-workflow')?.value || 'all';

    list.innerHTML = '';

    const filteredWorkflow = currentState.workflow.filter(w => {
        const matchesSearch = w.step.toLowerCase().includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (filteredWorkflow.length === 0) {
        list.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 1rem;">ไม่พบกระบวนการทำงาน</p>`;
        return;
    }

    filteredWorkflow.forEach(item => {
        let badge = '';
        if (item.status === 'completed') badge = `<span class="badge badge-success">เสร็จสิ้น</span>`;
        else if (item.status === 'active') badge = `<span class="badge badge-primary">กำลังทำ</span>`;
        else badge = `<span class="badge" style="background: rgba(255,255,255,0.1)">รอ</span>`;

        let imgTag = item.image ? `<img src="${item.image}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 6px; margin-top: 0.5rem;" alt="work photo">` : '';

        list.innerHTML += `
            <div class="timeline-item ${item.status}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="flex-between">
                        <h4 style="flex:1;">${item.step}</h4>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            ${badge}
                            <button class="btn btn-icon" style="width:25px; height:25px; font-size:0.9rem; background: var(--warning-color);" onclick="editWorkflow(${item.id})"><i class='bx bx-edit'></i></button>
                            <button class="btn btn-icon" style="width:25px; height:25px; font-size:0.9rem; background: var(--danger-color);" onclick="deleteWorkflow(${item.id})"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>
                    <p class="subtitle mt-3"><i class='bx bx-calendar'></i> ${item.date}</p>
                    ${imgTag}
                </div>
            </div>
        `;
    });
}

let activeWorkflowId = null;

function editWorkflow(id) {
    activeWorkflowId = id;
    const item = currentState.workflow.find(w => w.id === id);
    if (!item) return;

    document.getElementById('wf-step').value = item.step;
    document.getElementById('wf-date').value = item.date;
    document.getElementById('wf-status').value = item.status;
    document.getElementById('wf-image').value = '';
    openModal('add-workflow-modal');
}

function deleteWorkflow(id) {
    if (confirm("คุณต้องการขั้นตอนงานนี้ใช่ไหม?")) {
        currentState.workflow = currentState.workflow.filter(w => w.id !== id);
        saveStateToStorage();
        renderWorkflow();
    }
}

// --- ESTIMATION FUNCTIONALITY ---
const fenceEstimateData = [
    { name: '1. เสาเข็ม/ฟุตติ้ง', qty: '27–32 ต้น', priceRange: '500–1,500', unit: 'ต้น/ชุด', avgPrice: 1000 },
    { name: '2. บล็อก/อิฐมอญสำหรับก่อ', qty: '4,000–6,000 ก้อน', priceRange: '4–8', unit: 'ก้น', avgPrice: 6 },
    { name: '3. ปูนซีเมนต์ (ปอร์ตแลนด์/มอร์ตาร์)', qty: '150–250 ถุง', priceRange: '180–250', unit: 'ถุง', avgPrice: 215 },
    { name: '4. ทรายหยาบ + ทรายละเอียด', qty: '10–15 ลบ.ม.', priceRange: '400–800', unit: 'ลบ.ม.', avgPrice: 600 },
    { name: '5. หิน 1–2 (ผสมคอนกรีต)', qty: '5–10 ลบ.ม.', priceRange: '500–900', unit: 'ลบ.ม.', avgPrice: 700 },
    { name: '6. เหล็กเส้น (DB/RB)', qty: '1,000–2,000 กก.', priceRange: '25–40', unit: 'กก.', avgPrice: 32 },
    { name: '7. ลวดผูกเหล็ก', qty: '10–20 กก.', priceRange: '50–80', unit: 'กก.', avgPrice: 65 },
    { name: '8. ไม้แบบ/เหล็กแบบ', qty: '1 ชุด', priceRange: '5,000–15,000', unit: 'ชุด', avgPrice: 10000 },
    { name: '9. ท่อ/เหล็กเสียบรูระบายน้ำ', qty: 'ตามต้องการ', priceRange: '50–200', unit: 'ชิ้น', avgPrice: 125 },
    { name: '10. สีทา/กันซึม/จับเสี้ยม', qty: 'ตามพื้นที่', priceRange: '500–2,000', unit: 'กระป๋อง', avgPrice: 1250 }
];

function renderEstimation() {
    const list = document.getElementById('estimate-list');
    list.innerHTML = '';

    fenceEstimateData.forEach((item, index) => {
        list.innerHTML += `
            <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 1rem; font-size: 0.9rem;">
                    <div style="font-weight: 500;">${item.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${item.unit}</div>
                </td>
                <td style="padding: 1rem; font-size: 0.9rem; color: var(--text-secondary);">${item.qty}</td>
                <td style="padding: 1rem; font-size: 0.9rem; text-align: right;">
                    <span style="display: block; font-weight: 600; color: var(--warning-color);">฿${item.avgPrice.toLocaleString()}</span>
                    <span style="font-size: 0.7rem; color: var(--text-secondary);">${item.priceRange}.-</span>
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <button class="btn btn-icon" style="width: 32px; height: 32px; font-size: 1rem; background: var(--success-color);" 
                        onclick="addFromEstimate(${index})"><i class='bx bx-plus'></i></button>
                </td>
            </tr>
        `;
    });
}

function addFromEstimate(index) {
    const item = fenceEstimateData[index];
    currentState.materials.push({
        id: Date.now(),
        name: `${item.name} (ประมาณการ)`,
        price: item.avgPrice,
        location: "ประมาณการเบื้องต้น",
        image: null
    });
    saveStateToStorage();
    alert(`เพิ่ม "${item.name}" ลงในรายการจัดซื้อ (ราคากลาง) เรียบร้อยแล้ว`);
}

function applyTemplate() {
    const type = document.getElementById('brainstorm-type').value;
    if (type === 'none') return alert('กรุณาเลือกประเภทงาน');

    if (type === 'fence') {
        const steps = [
            '1. ตรวจสอบหลักหมุดและข้อกฎหมาย',
            '2. ออกแบบโครงสร้างและฐานราก',
            '3. เตรียมพื้นที่และขุดหลุมวางฐานราก',
            '4. ติดตั้งเสารั้วและเทคานคอดิน',
            '5. ก่อผนังรั้ว ฉาบปูน และทาสี',
            '6. ตรวจสอบความเรียบร้อยและปรับภูมิทัศน์'
        ];

        let confirmMsg = confirm("ระบบจะเพิ่มขั้นตอนงานทำรั้วมาตรฐานจำนวน 6 ขั้นตอน ยืนยันใช่ไหม?");
        if (!confirmMsg) return;

        steps.forEach((step, index) => {
            currentState.workflow.push({
                id: Date.now() + index, // Ensure unique IDs
                step: step,
                date: 'ยังไม่ระบุ',
                status: 'pending',
                image: null
            });
        });

        saveStateToStorage();
        renderWorkflow();
        closeModal('brainstorm-modal');
        alert('เพิ่มขั้นตอนงานสร้างรั้วบ้านสำเร็จ!');
    }
}

function openAddWorkflowModal() {
    activeWorkflowId = null;
    document.getElementById('wf-step').value = '';
    document.getElementById('wf-date').value = '';
    document.getElementById('wf-status').value = 'pending';
    document.getElementById('wf-image').value = '';
    openModal('add-workflow-modal');
}

async function saveWorkflow() {
    const step = document.getElementById('wf-step').value;
    const date = document.getElementById('wf-date').value || "ไม่ระบุ";
    const status = document.getElementById('wf-status').value;
    const imageInput = document.getElementById('wf-image');

    if (!step) return alert("กรุณาใส่ชื่อกระบวนการ");

    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
        try {
            imageData = await readAndCompressImage(imageInput.files[0]);
        } catch (e) {
            console.warn("Could not read image", e);
        }
    }

    if (activeWorkflowId) {
        const item = currentState.workflow.find(w => w.id === activeWorkflowId);
        if (item) {
            item.step = step;
            item.date = date;
            item.status = status;
            if (imageData) item.image = imageData;
        }
        activeWorkflowId = null;
    } else {
        currentState.workflow.push({
            id: Date.now(),
            step,
            date,
            status,
            image: imageData
        });
    }

    saveStateToStorage();
    renderWorkflow();
    closeModal('add-workflow-modal');
}

// Helper to compress images before storing in LocalStorage
function readAndCompressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Max Width 800px
                const maxWidth = 800;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to 0.7 quality JPEG
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// --- TIMER FUNCTIONALITY ---
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateTimerDisplay() {
    document.getElementById('timer-display').textContent = formatTime(currentState.timer.totalSeconds);
    document.getElementById('total-time-today').textContent = formatTime(currentState.timer.totalSeconds);
}

function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (currentState.timer.isActive) {
        clearInterval(timerInterval);
        currentState.timer.isActive = false;

        const now = Date.now();
        const sessionSeconds = Math.floor((now - currentState.timer.startTime) / 1000);
        currentState.timer.totalSeconds += sessionSeconds;

        btn.innerHTML = "<i class='bx bx-play'></i> เริ่มงาน";
        btn.classList.remove('btn-danger', 'btn-primary', 'btn-success');
        btn.classList.add('btn-success');
        document.getElementById('timer-status').textContent = 'พักงาน / เลิกงาน';
        document.getElementById('timer-status').style.color = 'var(--warning-color)';
        logTimeSpan("เริ่มทำงาน", "หยุดพัก", sessionSeconds);
    } else {
        currentState.timer.isActive = true;
        currentState.timer.startTime = Date.now();
        timerInterval = setInterval(updateTimerDisplay, 1000);

        btn.innerHTML = "<i class='bx bx-stop'></i> เลิกงาน / หยุดพัก";
        btn.classList.remove('btn-danger', 'btn-primary', 'btn-success');
        btn.classList.add('btn-danger');
        document.getElementById('timer-status').textContent = 'กำลังทำงาน...';
        document.getElementById('timer-status').style.color = 'var(--success-color)';
    }
    saveStateToStorage();
}

function resetTimer() {
    clearInterval(timerInterval);
    currentState.timer = {
        isActive: false,
        totalSeconds: 0,
        startTime: null
    };
    document.getElementById('timer-display').textContent = "00:00:00";
    document.getElementById('total-time-today').textContent = "00:00:00";
    document.getElementById('timer-btn').innerHTML = "<i class='bx bx-play-circle'></i> เริ่มนับเวลา";
    document.getElementById('timer-btn').className = "btn btn-primary w-100";
    document.getElementById('timer-status').textContent = 'ยังไม่เริ่ม';
    document.getElementById('timer-status').style.color = 'var(--text-secondary)';
    saveStateToStorage();
}

function logTimeSpan(actionStart, actionEnd, seconds) {
    if (seconds <= 0) return;
    const date = new Date().toLocaleDateString('th-TH');
    const timeSpent = formatTime(seconds);
    currentState.timeLogs.unshift({
        id: Date.now(),
        date: date,
        duration: timeSpent,
        desc: `บันทึกกิจกรรม (${actionStart} - ${actionEnd})`
    });
    saveStateToStorage();
    renderTimeLogs();
}

function renderTimeLogs() {
    const list = document.getElementById('time-log-list');
    list.innerHTML = '';

    if (currentState.timeLogs.length === 0) {
        list.innerHTML = `<p class="subtitle" style="text-align:center;">ยังไม่มีบันทึกการทำงาน</p>`;
        return;
    }

    currentState.timeLogs.forEach(log => {
        list.innerHTML += `
            <div class="flex-item-list">
                <div class="item-details" style="flex: 1;">
                    <h4>${log.desc}</h4>
                    <div class="item-meta">
                        <i class='bx bx-calendar'></i> ${log.date}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <div class="item-price" style="color: var(--text-primary); font-size: 1rem;">${log.duration}</div>
                    <button class="btn btn-icon" style="width:30px; height:30px; font-size:1rem; background: var(--warning-color);" onclick="editTimeLog(${log.id})"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-icon" style="width:30px; height:30px; font-size:1rem; background: var(--danger-color);" onclick="deleteTimeLog(${log.id})"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `;
    });
}

let activeTimeLogId = null;

function editTimeLog(id) {
    activeTimeLogId = id;
    const log = currentState.timeLogs.find(l => l.id === id);
    if (!log) return;

    document.getElementById('edit-timelog-desc').value = log.desc;
    document.getElementById('edit-timelog-duration').value = log.duration;
    document.getElementById('edit-timelog-date').value = log.date;

    openModal('edit-timelog-modal');
}

function saveTimeLogEdit() {
    if (!activeTimeLogId) return;

    const log = currentState.timeLogs.find(l => l.id === activeTimeLogId);
    if (!log) return;

    log.desc = document.getElementById('edit-timelog-desc').value || "บันทึกกิจกรรม";
    log.duration = document.getElementById('edit-timelog-duration').value || "00:00:00";
    log.date = document.getElementById('edit-timelog-date').value || new Date().toLocaleDateString('th-TH');

    saveStateToStorage();
    renderTimeLogs();
    closeModal('edit-timelog-modal');
}

function deleteTimeLog(id) {
    if (confirm("คุณต้องการลบบันทึกเวลานี้ใช่ไหม?")) {
        currentState.timeLogs = currentState.timeLogs.filter(l => l.id !== id);
        saveStateToStorage();
        renderTimeLogs();
    }
}

// --- ATTENDANCE FUNCTIONALITY ---
function renderWorkers() {
    const list = document.getElementById('worker-list');
    if (!list) return;
    list.innerHTML = '';

    if (currentState.workers.length === 0) {
        list.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top:2rem;">ยังไม่มีรายชื่อพนักงาน</p>`;
        return;
    }

    currentState.workers.forEach(worker => {
        let netPayable = worker.accumulatedWage - worker.advancePayment;

        list.innerHTML += `
            <div class="flex-item-list" style="flex-direction: column; align-items: stretch; gap: 0.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="stat-icon" style="width: 40px; height: 40px; font-size: 1.25rem; margin: 0; background: rgba(59, 130, 246, 0.1); color: var(--primary-color);">
                            <i class='bx bxs-user'></i>
                        </div>
                        <div class="item-details">
                            <h4 style="margin: 0;">${worker.name}</h4>
                            <div class="item-meta" style="margin-top: 0.25rem;">
                                ${worker.role} | ล่าสุด: ฿${worker.wage}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="switch">
                            <input type="checkbox" ${worker.isPresent ? 'checked' : ''} onchange="togglePresence(${worker.id})">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Wage Financials -->
                <div style="background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem;">
                    <div>ยอดสะสม: <strong style="color: var(--success-color);">฿${worker.accumulatedWage}</strong></div>
                    <div>เบิกล่วงหน้า: <strong style="color: var(--danger-color);">฿${worker.advancePayment}</strong></div>
                    <div style="grid-column: span 2; display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.1);">
                        <span>คงเหลือสุทธิ: <strong style="font-size: 1.1rem; color: var(--text-primary);">฿${netPayable}</strong></span>
                        <button class="btn btn-icon" style="width:30px; height:30px; font-size: 1rem; background: var(--warning-color);" onclick="openAdvanceModal(${worker.id}, '${worker.name}')">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function togglePresence(id) {
    const worker = currentState.workers.find(w => w.id === id);
    if (worker) {
        worker.isPresent = !worker.isPresent;
        saveStateToStorage();
        renderWorkers(); // re-render to update UI if necessary, though CSS handles the switch visually
    }
}

function addWorker() {
    const name = document.getElementById('worker-name').value;
    const role = document.getElementById('worker-role').value;
    const wage = document.getElementById('worker-wage').value;

    if (!name) return alert("กรุณาใส่ชื่อพนักงาน");

    currentState.workers.push({
        id: Date.now(),
        name,
        role: role || "ทั่วไป",
        wage: wage ? parseFloat(wage) : 350,
        isPresent: true,
        accumulatedWage: 0,
        advancePayment: 0
    });

    saveStateToStorage();
    renderWorkers();
    closeModal('add-worker-modal');
}

let activeWorkerId = null;

function openAdvanceModal(id, name) {
    activeWorkerId = id;
    const worker = currentState.workers.find(w => w.id === id);
    if (!worker) return;

    document.getElementById('edit-worker-name').textContent = name;
    document.getElementById('edit-accumulated').value = worker.accumulatedWage;
    document.getElementById('edit-advance').value = worker.advancePayment;

    openModal('edit-wage-modal');
}

function saveWorkerFinancials() {
    if (!activeWorkerId) return;

    const worker = currentState.workers.find(w => w.id === activeWorkerId);
    if (!worker) return;

    worker.accumulatedWage = parseFloat(document.getElementById('edit-accumulated').value) || 0;
    worker.advancePayment = parseFloat(document.getElementById('edit-advance').value) || 0;

    saveStateToStorage();
    renderWorkers();
    closeModal('edit-wage-modal');
}

function checkoutWorkersDay() {
    // Add today's wage to accumulated wage for present workers
    let count = 0;
    currentState.workers.forEach(w => {
        if (w.isPresent) {
            w.accumulatedWage += w.wage;
            w.isPresent = false; // reset for next day
            count++;
        }
    });

    saveStateToStorage();
    alert(`บันทึกยอดรายวันสำเร็จ (${count} คน)\nระบบได้นำค่าแรงไปทบยอดสะสมและล้างสถานะเข้างานสำหรับวันพรุ่งนี้แล้ว`);
    renderWorkers();
}

function clearWageCycle() {
    if (confirm('คุณต้องการจ่ายเงินและล้างยอดสะสม (รอบ 15 วัน) ใช่หรือไม่?\nยอดสะสมและเบิกล่วงหน้าจะกลับเป็น 0')) {
        currentState.workers.forEach(w => {
            w.accumulatedWage = 0;
            w.advancePayment = 0;
        });
        saveStateToStorage();
        renderWorkers();
        alert('ล้างรอบบิลค่าแรงเรียบร้อยแล้ว');
    }
}

function calculateWages() {
    let totalWages = 0;
    let presentCount = 0;

    let reportHtml = `<div style="text-align: left; font-size: 0.95rem;">`;

    currentState.workers.forEach(w => {
        if (w.isPresent) {
            totalWages += w.wage;
            presentCount++;
            reportHtml += `
            <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 0.25rem;">
                <span><i class='bx bx-check' style="color:var(--success-color);"></i> ${w.name} (${w.role})</span>
                <span style="color:var(--primary-color);">฿${w.wage}</span>
            </div>`;
        }
    });

    reportHtml += `
        <div style="display:flex; justify-content:space-between; margin-top: 1rem; font-weight: bold; font-size: 1.1rem;">
            <span>รวมค่าแรงวันนี้ (${presentCount} คน):</span>
            <span style="color:var(--danger-color);">฿${totalWages.toLocaleString()}</span>
        </div>
        <div style="margin-top: 1.5rem;">
            <button class="btn btn-success w-100" onclick="checkoutWorkersDay(); closeModal('wage-report-modal');">
                <i class='bx bx-check-double'></i> ยืนยันจบวัน (ทบยอดสะสม)
            </button>
        </div>
    </div>`;

    document.getElementById('wage-report-content').innerHTML = presentCount > 0 ? reportHtml : "<p>ไม่มีพนักงานเข้างานวันนี้</p>";
    openModal('wage-report-modal');
}

// --- PRINT FUNCTIONALITY ---
function printGroupReport() {
    const printArea = document.getElementById('print-area');
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <h2 class="text-center" style="margin-bottom: 5px;">รายงานสรุปค่าแรงทีมงาน</h2>
        <p class="text-center" style="margin-bottom: 20px;">วันที่พิมพ์: ${dateStr}</p>
        <table class="print-table">
            <thead>
                <tr>
                    <th>ลำดับ</th>
                    <th>ชื่อ - นามสกุล</th>
                    <th>ตำแหน่ง</th>
                    <th class="text-right">ค่าแรงต่อวัน</th>
                    <th class="text-right">สะสมทั้งหมด</th>
                    <th class="text-right">เบิกล่วงหน้า</th>
                    <th class="text-right">คงเหลือสุทธิ</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalAccumulated = 0;
    let totalAdvance = 0;
    let totalNet = 0;

    currentState.workers.forEach((w, index) => {
        const net = w.accumulatedWage - w.advancePayment;
        totalAccumulated += w.accumulatedWage;
        totalAdvance += w.advancePayment;
        totalNet += net;

        html += `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${w.name}</td>
                <td>${w.role}</td>
                <td class="text-right">${w.wage.toLocaleString()}</td>
                <td class="text-right">${w.accumulatedWage.toLocaleString()}</td>
                <td class="text-right">${w.advancePayment.toLocaleString()}</td>
                <td class="text-right"><strong>${net.toLocaleString()}</strong></td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot>
                <tr style="background-color:#f8f8f8; font-weight:bold;">
                    <td colspan="4" class="text-right">รวมทั้งสิ้น</td>
                    <td class="text-right">${totalAccumulated.toLocaleString()}</td>
                    <td class="text-right">${totalAdvance.toLocaleString()}</td>
                    <td class="text-right">${totalNet.toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
        <div style="margin-top: 50px; display: flex; justify-content: space-around;">
            <div style="text-align: center;">
                <p>ลงชื่อ................................................ผู้ตรวจทาน</p>
                <p style="margin-top: 10px;">(..........................................................)</p>
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

function printIndividualReport() {
    if (!activeWorkerId) return;
    const worker = currentState.workers.find(w => w.id === activeWorkerId);
    if (!worker) return;

    // Save current values if edited before printing
    saveWorkerFinancials();

    const net = worker.accumulatedWage - worker.advancePayment;
    const printArea = document.getElementById('print-area');
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 20px;">
            <h2 class="text-center" style="margin-bottom: 5px;">ใบรับเงิน / แจ้งยอดค่าแรง</h2>
            <p class="text-center" style="margin-bottom: 20px;">วันที่พิมพ์: ${dateStr}</p>
            
            <div style="margin-bottom: 20px;">
                <p><strong>ชื่อ-นามสกุลพนักงาน:</strong> ${worker.name}</p>
                <p><strong>ตำแหน่ง:</strong> ${worker.role}</p>
                <p><strong>ค่าแรงต่อวัน:</strong> ฿${worker.wage.toLocaleString()}</p>
            </div>

            <table class="print-table">
                <thead>
                    <tr>
                        <th>รายการ</th>
                        <th class="text-right">จำนวนเงิน (บาท)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>ค่าแรงสะสมรวม</td>
                        <td class="text-right">${worker.accumulatedWage.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>หัก เบิกล่วงหน้า</td>
                        <td class="text-right" style="color: red;">-${worker.advancePayment.toLocaleString()}</td>
                    </tr>
                    <tr style="font-size: 1.2rem; font-weight: bold;">
                        <td>ยอดคงเหลือจ่ายจริงสุทธิ</td>
                        <td class="text-right">${net.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                <div style="text-align: center; width: 45%;">
                    <p>ลงชื่อ................................................ผู้จ่ายเงิน</p>
                    <p style="margin-top: 10px;">(..........................................................)</p>
                </div>
                <div style="text-align: center; width: 45%;">
                    <p>ลงชื่อ................................................ผู้รับเงิน</p>
                    <p style="margin-top: 10px;">(${worker.name})</p>
                </div>
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

// --- COMPARE FUNCTIONALITY ---
function updateCompareTitle() {
    const name = document.getElementById('compare-name').value || 'สินค้า';
    // optionally can show dynamic title
}

function calculateCompare() {
    // Store A
    const priceA = parseFloat(document.getElementById('store-a-price').value) || 0;
    const qtyA = parseFloat(document.getElementById('store-a-qty').value) || 0;
    const nameA = document.getElementById('store-a-name').value || 'ร้าน A';
    const unitA = document.getElementById('store-a-unit').value || 'หน่วย';

    // Store B
    const priceB = parseFloat(document.getElementById('store-b-price').value) || 0;
    const qtyB = parseFloat(document.getElementById('store-b-qty').value) || 0;
    const nameB = document.getElementById('store-b-name').value || 'ร้าน B';
    const unitB = document.getElementById('store-b-unit').value || 'หน่วย';

    const resultDiv = document.getElementById('compare-result');
    const detailsDiv = document.getElementById('compare-details');

    if (priceA > 0 && qtyA > 0 && priceB > 0 && qtyB > 0) {
        const costPerUnitA = priceA / qtyA;
        const costPerUnitB = priceB / qtyB;

        let bestStore = '';
        let bestPrice = 0;
        let diffPercent = 0;
        let diffValue = 0;

        let html = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; padding-bottom: 0.5rem; border-bottom: 1px dashed rgba(255,255,255,0.2);">
                <span>${nameA}</span>
                <strong style="color:var(--primary-color);">฿${costPerUnitA.toFixed(2)} / ${unitA}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; padding-bottom: 0.5rem; border-bottom: 1px dashed rgba(255,255,255,0.2);">
                <span>${nameB}</span>
                <strong style="color:var(--success-color);">฿${costPerUnitB.toFixed(2)} / ${unitB}</strong>
            </div>
        `;

        if (costPerUnitA < costPerUnitB) {
            diffValue = costPerUnitB - costPerUnitA;
            diffPercent = (diffValue / costPerUnitB) * 100;
            html += `<div style="font-weight:bold; color:var(--success-color);"><i class='bx bx-check-circle'></i> ${nameA} ประหยัดกว่า ${diffPercent.toFixed(1)}%</div>`;
            bestStore = nameA;
            bestPrice = priceA;
        } else if (costPerUnitB < costPerUnitA) {
            diffValue = costPerUnitA - costPerUnitB;
            diffPercent = (diffValue / costPerUnitA) * 100;
            html += `<div style="font-weight:bold; color:var(--success-color);"><i class='bx bx-check-circle'></i> ${nameB} ประหยัดกว่า ${diffPercent.toFixed(1)}%</div>`;
            bestStore = nameB;
            bestPrice = priceB;
        } else {
            html += `<div style="font-weight:bold; color:var(--text-primary);"><i class='bx bx-minus-circle'></i> ทั้งสองร้านราคาต่อหน่วยเท่ากัน</div>`;
            bestStore = nameA;
            bestPrice = priceA;
        }

        currentState.compareResult = {
            storeName: bestStore,
            price: bestPrice,
            productName: document.getElementById('compare-name').value || 'สินค้าจากการเปรียบเทียบ',
            location: `${nameA} vs ${nameB}`
        };

        detailsDiv.innerHTML = html;
        resultDiv.style.display = 'block';
    } else {
        resultDiv.style.display = 'none';
        currentState.compareResult = null;
    }
    saveStateToStorage();
}

function saveToMaterialsFromCompare() {
    if (!currentState.compareResult) return;

    currentState.materials.push({
        id: Date.now(),
        name: currentState.compareResult.productName,
        price: currentState.compareResult.price,
        location: currentState.compareResult.storeName
    });

    saveStateToStorage();
    alert(`บันทึก ${currentState.compareResult.productName} จากร้าน ${currentState.compareResult.storeName} ในราคา ฿${currentState.compareResult.price} ลงรายการจัดซื้อเรียบร้อยแล้ว`);

    // Reset and hide compare view
    document.getElementById('store-a-price').value = '';
    document.getElementById('store-b-price').value = '';
    document.getElementById('compare-name').value = '';
    document.getElementById('compare-result').style.display = 'none';

    // Navigate back to materials to see the new item
    navigate('materials', document.querySelector('.bottom-nav .nav-item:nth-child(2)'));
}

// --- DATA MANAGEMENT (BACKUP & EXPORT) ---
function exportDataJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "siteMaster_backup_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function triggerImportJSON() {
    document.getElementById('import-json').click();
}

function importDataJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData && typeof importedData === 'object') {
                currentState = { ...currentState, ...importedData };
                saveStateToStorage();
                alert("กู้คืนข้อมูลสำเร็จ! ระบบจะทำการรีเฟรชหน้าเว็บ");
                location.reload();
            }
        } catch (err) {
            alert("ไฟล์ไม่ถูกต้อง หรือเสียหาย");
        }
    };
    reader.readAsText(file);
}

function exportMaterialsCSV() {
    if (currentState.materials.length === 0) return alert("ไม่มีข้อมูลจัดซื้อ");
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM
    csvContent += "ชื่อวัสดุ/อุปกรณ์,ราคา (บาท),ร้านค้า\n";
    currentState.materials.forEach(m => {
        csvContent += `"${m.name}","${m.price}","${m.location}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "materials_" + new Date().toISOString().slice(0, 10) + ".csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function exportWorkersCSV() {
    if (currentState.workers.length === 0) return alert("ไม่มีข้อมูลค่าแรง");
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "ชื่อพนักงาน,ตำแหน่ง,ค่าแรงต่อวัน,ยอดสะสม,เบิกล่วงหน้า\n";
    currentState.workers.forEach(w => {
        csvContent += `"${w.name}","${w.role}","${w.wage}","${w.accumulatedWage}","${w.advancePayment}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "workers_" + new Date().toISOString().slice(0, 10) + ".csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}
