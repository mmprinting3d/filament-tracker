import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const spoolsCollection = collection(db, "spools");

// Keep local in-memory snapshot of elements for live rendering UI filtration Engine
let allSpools = [];

// DOM Element Registry
const spoolGrid = document.getElementById("spool-grid");
const searchInput = document.getElementById("search-input");
const filterMaterial = document.getElementById("filter-material");
const themeToggle = document.getElementById("toggle-theme");
const spoolModal = document.getElementById("spool-modal");
const spoolForm = document.getElementById("spool-form");
const modalTitle = document.getElementById("modal-title");
const btnOpenAddModal = document.getElementById("btn-open-add-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnDeleteSpool = document.getElementById("btn-delete-spool");
const singleSpoolContainer = document.getElementById("single-spool-container");

// Stats Registry Elements
const statTotalSpools = document.getElementById("stat-total-spools");
const statTotalWeight = document.getElementById("stat-total-weight");
const statTotalCost = document.getElementById("stat-total-cost");

// Check if Direct URL Param access engine context triggers
const urlParams = new URLSearchParams(window.location.search);
const targetSpoolId = urlParams.get('id');

// --- Real-time Firestore Sync Subscriptions ---
function initAppListeners() {
    onSnapshot(spoolsCollection, (snapshot) => {
        allSpools = [];
        snapshot.forEach((docSnap) => {
            allSpools.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Arrange items by updated timestamp order by default
        allSpools.sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));
        
        processApplicationDataState();
    }, (error) => {
        console.error("Firestore loading failure: ", error);
        spoolGrid.innerHTML = `<div class="loading-spinner" style="color:var(--danger)">Failed to connect to real-time database. Please check configuration credentials.</div>`;
    });
}

// Global Process logic execution router block
function processApplicationDataState() {
    updateStatistics(allSpools);
    
    if (targetSpoolId) {
        // Run application in isolated single-card NFC/QR configuration mode setup view
        renderSingleSpoolMode(targetSpoolId);
    } else {
        // Run normal dashboard engine tracking rendering mode logic
        renderSpoolDashboard(allSpools);
    }
}

// --- Dashboard Component Generator Engine ---
function renderSpoolDashboard(spoolsArray) {
    singleSpoolContainer.classList.add("hidden");
    spoolGrid.classList.remove("hidden");
    
    const query = searchInput.value.toLowerCase().trim();
    const materialFilter = filterMaterial.value;

    const filtered = spoolsArray.filter(spool => {
        const matchesSearch = spool.brand.toLowerCase().includes(query) || 
                              spool.color.toLowerCase().includes(query) || 
                              (spool.notes && spool.notes.toLowerCase().includes(query));
        const matchesMaterial = materialFilter === "" || spool.material === materialFilter;
        return matchesSearch && matchesMaterial;
    });

    if (filtered.length === 0) {
        spoolGrid.innerHTML = `<div class="loading-spinner">No matching spools found in active view.</div>`;
        return;
    }

    spoolGrid.innerHTML = "";
    filtered.forEach(spool => {
        spoolGrid.appendChild(createSpoolCardElement(spool, false));
    });
}

// --- Isolated QR/NFC UI Target Loader view logic ---
function renderSingleSpoolMode(spoolId) {
    spoolGrid.classList.add("hidden");
    singleSpoolContainer.classList.remove("hidden");
    
    const spool = allSpools.find(s => s.id === spoolId);
    
    if (!spool) {
        singleSpoolContainer.innerHTML = `
            <div class="controls-card" style="text-align:center;">
                <span class="material-icons" style="font-size:3rem; color:var(--danger);">error_outline</span>
                <h2>Spool Not Found</h2>
                <p style="color:var(--text-secondary); margin: 10px 0;">Spool identification key "${spoolId}" doesn't match verified data assets.</p>
                <a href="${window.location.origin}${window.location.pathname}" class="btn btn-primary" style="text-decoration:none; margin-top:10px;">Return to Dashboard</a>
            </div>
        `;
        return;
    }

    singleSpoolContainer.innerHTML = `
        <div style="margin-bottom:15px;">
            <a href="${window.location.origin}${window.location.pathname}" class="btn btn-primary" style="text-decoration:none;"><span class="material-icons">arrow_back</span> Return to Dashboard</a>
        </div>
    `;
    singleSpoolContainer.appendChild(createSpoolCardElement(spool, true));
}

// --- Factory Element UI Component Creator function builder ---
function createSpoolCardElement(spool, isSingleIsolatedView = false) {
    const card = document.createElement("div");
    card.className = "spool-card";
    
    const remaining = Number(spool.remainingWeight) || 0;
    const original = Number(spool.originalWeight) || 1; 
    const pct = Math.max(0, Math.min(100, Math.round((remaining / original) * 100)));
    
    // Convert timestamp tracking objects neatly
    let formattedDate = "Never";
    if (spool.lastUpdated?.seconds) {
        formattedDate = new Date(spool.lastUpdated.seconds * 1000).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
    }

    card.innerHTML = `
        <div class="spool-header">
            <div>
                <div class="spool-title">${spool.color}</div>
                <div class="spool-brand">${spool.brand}</div>
            </div>
            <button class="icon-btn btn-edit-trigger" title="Edit Properties"><span class="material-icons">edit</span></button>
        </div>
        <div class="badges">
            <span class="badge badge-material">${spool.material}</span>
            <span class="badge"><span class="color-preview-badge" style="background-color: ${sanitizeColorName(spool.color)};"></span>Color Preview</span>
        </div>
        <div class="weight-tracker">
            <div class="weight-details">
                <span>Remaining: <strong>${remaining}g</strong></span>
                <span style="color:var(--text-secondary)">${pct}% (${original}g net)</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
        </div>
        
        <div class="quick-update-row">
            <label style="flex-grow:1; font-size:0.8rem;">Quick Weight Adjust:</label>
            <button class="icon-btn btn-quick-sub" style="padding:4px;"><span class="material-icons">remove_circle_outline</span></button>
            <input type="number" class="quick-weight-input" value="${remaining}" min="0" max="${original}">
            <button class="icon-btn btn-quick-add" style="padding:4px;"><span class="material-icons">add_circle_outline</span></button>
            <button class="btn btn-primary btn-quick-save" style="padding: 6px 12px; font-size:0.8rem;">Save</button>
        </div>

        <div class="card-notes">${spool.notes ? spool.notes : 'No specific usage or printer configurations profile notes noted.'}</div>
        
        <div class="card-footer">
            <span class="timestamp">Updated: ${formattedDate}</span>
            <span style="font-weight:600; font-size:0.9rem;">$${Number(spool.cost).toFixed(2)}</span>
        </div>
    `;

    // Hook Up Node Event Operations internally
    card.querySelector(".btn-edit-trigger").addEventListener("click", () => openModal(spool));
    
    const quickInput = card.querySelector(".quick-weight-input");
    card.querySelector(".btn-quick-sub").addEventListener("click", () => {
        quickInput.value = Math.max(0, Number(quickInput.value) - 10);
    });
    card.querySelector(".btn-quick-add").addEventListener("click", () => {
        quickInput.value = Math.min(original, Number(quickInput.value) + 10);
    });
    
    card.querySelector(".btn-quick-save").addEventListener("click", async () => {
        const targetValue = Math.max(0, Number(quickInput.value));
        try {
            await updateDoc(doc(db, "spools", spool.id), {
                remainingWeight: targetValue,
                lastUpdated: serverTimestamp()
            });
        } catch (err) {
            alert("Error running quick update cycle updates: " + err.message);
        }
    });

    return card;
}

// --- Realtime Dashboard Global Stats calculations ---
function updateStatistics(spools) {
    let totalSpoolsCount = spools.length;
    let totalWeightRemaining = 0;
    let totalCostValuation = 0;

    spools.forEach(spool => {
        totalWeightRemaining += (Number(spool.remainingWeight) || 0);
        totalCostValuation += (Number(spool.cost) || 0);
    });

    statTotalSpools.textContent = totalSpoolsCount;
    statTotalWeight.textContent = `${(totalWeightRemaining / 1000).toFixed(2)} kg (${totalWeightRemaining}g)`;
    statTotalCost.textContent = `$${totalCostValuation.toFixed(2)}`;
}

// --- Modal Presentation Form Utilities Management Window ---
function openModal(spool = null) {
    spoolForm.reset();
    document.getElementById("form-purchase-date").valueAsDate = new Date(); // Standard auto set configuration placeholder
    
    if (spool) {
        modalTitle.textContent = "Edit Spool Information";
        document.getElementById("form-id").value = spool.id;
        document.getElementById("form-brand").value = spool.brand;
        document.getElementById("form-material").value = spool.material;
        document.getElementById("form-color").value = spool.color;
        document.getElementById("form-original-weight").value = spool.originalWeight;
        document.getElementById("form-remaining-weight").value = spool.remainingWeight;
        document.getElementById("form-cost").value = spool.cost;
        document.getElementById("form-purchase-date").value = spool.purchaseDate || "";
        document.getElementById("form-notes").value = spool.notes || "";
        btnDeleteSpool.classList.remove("hidden");
    } else {
        modalTitle.textContent = "Add New Inventory Spool";
        document.getElementById("form-id").value = "";
        btnDeleteSpool.classList.add("hidden");
    }
    spoolModal.classList.remove("hidden");
}

function closeModal() {
    spoolModal.classList.add("hidden");
}

// --- Event Registration Handlers Blocks ---
spoolForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const idValue = document.getElementById("form-id").value;
    const brand = document.getElementById("form-brand").value.trim();
    const material = document.getElementById("form-material").value;
    const color = document.getElementById("form-color").value.trim();
    const originalWeight = Number(document.getElementById("form-original-weight").value);
    const remainingWeight = Number(document.getElementById("form-remaining-weight").value);
    const cost = Number(document.getElementById("form-cost").value);
    const purchaseDate = document.getElementById("form-purchase-date").value;
    const notes = document.getElementById("form-notes").value.trim();

    // ID String Generator Strategy: Generate descriptive IDs if new, or keep active ID if update operation occurs
    const documentTargetId = idValue ? idValue : `${brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${color.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const dataPayload = {
        brand, material, color, originalWeight, remainingWeight, cost, purchaseDate, notes,
        lastUpdated: serverTimestamp()
    };

    try {
        await setDoc(doc(db, "spools", documentTargetId), dataPayload, { merge: true });
        closeModal();
    } catch (err) {
        alert("Firestore transaction writing exception raised: " + err.message);
    }
});

btnDeleteSpool.addEventListener("click", async () => {
    const idValue = document.getElementById("form-id").value;
    if (!idValue) return;
    
    if (confirm("Are you entirely sure you want to completely delete this spool data record from deployment clusters permanently?")) {
        try {
            await deleteDoc(doc(db, "spools", idValue));
            closeModal();
            // If the user was viewing this via specific isolated ID parameters, return back safely to base site root directory
            if (targetSpoolId) {
                window.location.href = window.location.origin + window.location.pathname;
            }
        } catch (err) {
            alert("Deletion routing engine execution failed: " + err.message);
        }
    }
});

// Dark/Light layout logic toggles state switches functions
themeToggle.addEventListener("click", () => {
    const body = document.body;
    const isDark = body.classList.toggle("dark-mode");
    body.classList.toggle("light-mode", !isDark);
    themeToggle.innerHTML = `<span class="material-icons">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
});

// Input filtering updates triggers
searchInput.addEventListener("input", () => renderSpoolDashboard(allSpools));
filterMaterial.addEventListener("change", () => renderSpoolDashboard(allSpools));
btnOpenAddModal.addEventListener("click", () => openModal(null));
btnCloseModal.addEventListener("click", closeModal);
window.addEventListener("click", (e) => { if(e.target === spoolModal) closeModal(); });

// Quick visual hex color generator utility for preview circle badge
function sanitizeColorName(str) {
    const basicColors = ['red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'grey', 'gray', 'pink', 'brown', 'silver', 'gold'];
    const lower = str.toLowerCase();
    for (let c of basicColors) {
        if (lower.includes(c)) return c;
    }
    return 'transparent';
}

// Global Core App Launch Ignition Trigger
initAppListeners();