/**
 * app.js - OppHub Application Logic
 * 
 * This file handles UI interactions and interfaces with a Backend.
 * Below is a placeholder structure using SheetDB to connect to a Google Sheet.
 * 
 * TO CONNECT YOUR OWN DATABASE (SheetDB):
 * 1. Uncomment the SHEETDB_URL constant.
 * 2. Paste your SheetDB API URL.
 * 3. Replace the mock functions with the SheetDB logic shown in the comments.
 */

/* 
// --- SHEETDB SETUP ---
// Replace with your actual SheetDB API URL
const SHEETDB_URL = 'https://sheetdb.io/api/v1/YOUR_API_ID';
*/
const SHEETDB_URL = 'https://sheetdb.io/api/v1/en3lcxkoq0btl';

// --- APP STATE ---
let currentOpportunities = [];

// --- DOM ELEMENTS ---
const elements = {
    grid: document.getElementById('opportunitiesGrid'),
    filterCategory: document.getElementById('filterCategory'),
    sortOpps: document.getElementById('sortOpps'),
    showAvailableOnly: document.getElementById('showAvailableOnly'),
    addBtn: document.getElementById('addBtn'),
    modal: document.getElementById('addModal'),
    closeModal: document.getElementById('closeModal'),
    addForm: document.getElementById('addForm'),
    submitBtn: document.getElementById('submitBtn'),
    editModal: document.getElementById('editModal'),
    closeEditModal: document.getElementById('closeEditModal'),
    editForm: document.getElementById('editForm'),
    updateBtn: document.getElementById('updateBtn')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

async function initApp() {
    // Show loading skeleton
    elements.grid.innerHTML = '<div class="loading-state">Fetching opportunities...</div>';
    
    // Fetch data from BaaS
    currentOpportunities = await fetchOpportunitiesFromDB();
    renderGrid();
}

// --- DATABASE INTERACTIONS ---

// 1. Read Data
async function fetchOpportunitiesFromDB() {
    // SHEETDB IMPLEMENTATION:
    try {
        const response = await fetch(SHEETDB_URL);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

// 2. Write Data
async function addOpportunityToDB(oppData) {
    // SHEETDB IMPLEMENTATION:
    const newRecord = {
        id: Math.random().toString(36).substr(2, 9),
        ...oppData,
        applied: false,
        createdAt: new Date().toISOString()
    };
    
    const response = await fetch(SHEETDB_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data: [newRecord]
        })
    });
    
    if (!response.ok) throw new Error("Failed to save to Google Sheet");
    return newRecord;
}

// 3. Update Data
async function updateOpportunityInDB(id, updatedData) {
    // SHEETDB IMPLEMENTATION:
    // If PUT doesn't work well, we implement Update by Deleting and Re-adding
    
    // First, delete the old record
    const delResponse = await fetch(`${SHEETDB_URL}/id/${id}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    if (!delResponse.ok) throw new Error("Failed to delete old record during update");

    // Then, create a new record keeping the SAME id and creation date if possible
    const currentOpp = currentOpportunities.find(o => o.id === id);
    const newRecord = {
        id: id,
        ...updatedData,
        applied: currentOpp ? currentOpp.applied : false,
        createdAt: currentOpp ? currentOpp.createdAt : new Date().toISOString()
    };

    const addResponse = await fetch(SHEETDB_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data: [newRecord]
        })
    });
    if (!addResponse.ok) throw new Error("Failed to add updated record");
    
    return newRecord;
}

// 4. Delete Data
async function deleteOpportunityFromDB(id) {
    // SHEETDB IMPLEMENTATION:
    const response = await fetch(`${SHEETDB_URL}/id/${id}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error("Failed to delete from Google Sheet");
}

// --- UI RENDERING ---
function renderGrid() {
    let filtered = [...currentOpportunities];
    
    // 1. Apply Filter
    const category = elements.filterCategory.value;
    if (category !== 'all') {
        filtered = filtered.filter(opp => opp.category === category);
    }
    
    // 1.5. Apply Available Only Filter
    if (elements.showAvailableOnly.checked) {
        const today = new Date();
        filtered = filtered.filter(opp => {
            const isApplied = (opp.applied === true || opp.applied === 'true' || opp.applied === 'TRUE');
            const deadlineDate = new Date(opp.deadline + 'T23:59:59');
            const hasPassed = deadlineDate.getTime() - today.getTime() < 0;
            return !isApplied && !hasPassed;
        });
    }

    // 2. Apply Sort
    const sortVal = elements.sortOpps.value; // e.g. 'deadline-asc'
    filtered.sort((a, b) => {
        if (sortVal === 'deadline-asc') return new Date(a.deadline) - new Date(b.deadline);
        if (sortVal === 'deadline-desc') return new Date(b.deadline) - new Date(a.deadline);
        if (sortVal === 'added-desc') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortVal === 'added-asc') return new Date(a.createdAt) - new Date(b.createdAt);
        return 0;
    });

    // 3. Render HTML
    if (filtered.length === 0) {
        elements.grid.innerHTML = '<div class="empty-state">No opportunities found matching your criteria.</div>';
        return;
    }

    elements.grid.innerHTML = filtered.map(opp => createCardHTML(opp)).join('');
}

function createCardHTML(opp) {
    const today = new Date();
    const deadlineDate = new Date(opp.deadline + 'T23:59:59');
    const timeDiffMs = deadlineDate.getTime() - today.getTime();
    
    let daysLeft = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
    
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(deadlineDate);
    let deadlineStr = '';
    let isUrgent = false;

    if (timeDiffMs < 0) {
        deadlineStr = "Past due";
        isUrgent = true;
    } else {
        deadlineStr = `Closes ${formattedDate}`;
        if (daysLeft <= 7) isUrgent = true;
    }
    
    // Parse applied status
    const isApplied = (opp.applied === true || opp.applied === 'true' || opp.applied === 'TRUE');

    return `
        <article class="card ${isApplied ? 'is-applied' : ''}">
            <div class="card-header">
                <span class="badge ${opp.category}">${opp.category}</span>
                <div class="admin-actions">
                    <button class="btn-admin edit" data-id="${opp.id}" title="Edit">✎</button>
                    <button class="btn-admin delete" data-id="${opp.id}" title="Delete">✕</button>
                </div>
            </div>
            <h3 class="card-title">${escapeHTML(opp.title)}</h3>
            <p class="card-desc">${escapeHTML(opp.description)}</p>
            <div class="card-footer">
                <div class="footer-info">
                    <span class="deadline ${isUrgent && !isApplied ? 'urgent' : ''}" title="${formattedDate}">
                        ⏱ ${deadlineStr}
                    </span>
                    <button class="btn-applied-pill ${isApplied ? 'active' : ''}" data-id="${opp.id}">
                        <span class="check-icon">✓</span> ${isApplied ? 'Applied' : 'Mark Applied'}
                    </button>
                </div>
                <a href="${escapeHTML(opp.link)}" target="_blank" rel="noopener noreferrer" class="card-link-btn">
                    Apply ↗
                </a>
            </div>
        </article>
    `;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Controls
    elements.filterCategory.addEventListener('change', renderGrid);
    elements.sortOpps.addEventListener('change', renderGrid);
    elements.showAvailableOnly.addEventListener('change', renderGrid);

    // Modal behavior
    elements.addBtn.addEventListener('click', () => {
        elements.modal.classList.add('active');
    });

    elements.closeModal.addEventListener('click', () => {
        elements.modal.classList.remove('active');
        elements.addForm.reset();
    });

    // Close on clicking outside modal content
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            elements.modal.classList.remove('active');
            elements.addForm.reset();
        }
    });

    elements.closeEditModal.addEventListener('click', () => {
        elements.editModal.classList.remove('active');
    });

    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) {
            elements.editModal.classList.remove('active');
        }
    });

    // Form Submission
    elements.addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable button while submitting
        const originalText = elements.submitBtn.innerText;
        elements.submitBtn.innerText = 'Publishing...';
        elements.submitBtn.disabled = true;

        const newOppData = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            deadline: document.getElementById('deadline').value,
            link: document.getElementById('link').value,
            description: document.getElementById('description').value
        };

        try {
            const addedOpp = await addOpportunityToDB(newOppData);
            currentOpportunities.push(addedOpp);
            elements.modal.classList.remove('active');
            elements.addForm.reset();
            renderGrid();
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Failed to submit opportunity. Please try again.");
        } finally {
            elements.submitBtn.innerText = originalText;
            elements.submitBtn.disabled = false;
        }
    });

    // Edit Form Submission
    elements.editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalText = elements.updateBtn.innerText;
        elements.updateBtn.innerText = 'Updating...';
        elements.updateBtn.disabled = true;

        const id = document.getElementById('edit-id').value;
        const updatedData = {
            title: document.getElementById('edit-title').value,
            category: document.getElementById('edit-category').value,
            deadline: document.getElementById('edit-deadline').value,
            link: document.getElementById('edit-link').value,
            description: document.getElementById('edit-description').value
        };

        try {
            await updateOpportunityInDB(id, updatedData);
            
            // Update local state
            const index = currentOpportunities.findIndex(o => o.id === id);
            if(index !== -1) {
                currentOpportunities[index] = { ...currentOpportunities[index], ...updatedData };
            }
            
            elements.editModal.classList.remove('active');
            renderGrid();
        } catch (error) {
            console.error("Error updating document: ", error);
            alert("Failed to update opportunity. Please try again.");
        } finally {
            elements.updateBtn.innerText = originalText;
            elements.updateBtn.disabled = false;
        }
    });

    // Handle Edit, Delete, and Applied button clicks (Event Delegation)
    elements.grid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-admin.edit');
        const deleteBtn = e.target.closest('.btn-admin.delete');
        const appliedBtn = e.target.closest('.btn-applied-pill');

        if (appliedBtn) {
            const id = appliedBtn.dataset.id;
            const oppIndex = currentOpportunities.findIndex(o => o.id === id);
            if (oppIndex > -1) {
                const opp = currentOpportunities[oppIndex];
                const isCurrentlyApplied = (opp.applied === true || opp.applied === 'true' || opp.applied === 'TRUE');
                const newAppliedState = !isCurrentlyApplied;
                
                // Optimistic UI Update
                opp.applied = newAppliedState;
                renderGrid(); // Re-render to update card opacity and UI fully
                
                // Backend Update
                try {
                    await updateOpportunityInDB(id, opp);
                } catch (err) {
                    console.error("Failed to update status", err);
                    alert("Failed to save applied status.");
                    // Revert if failed
                    opp.applied = isCurrentlyApplied;
                    renderGrid();
                }
            }
        }

        if (editBtn) {
            const id = editBtn.dataset.id;
            const opp = currentOpportunities.find(o => o.id === id);
            if (opp) {
                document.getElementById('edit-id').value = opp.id;
                document.getElementById('edit-title').value = opp.title;
                document.getElementById('edit-category').value = opp.category;
                document.getElementById('edit-deadline').value = opp.deadline;
                document.getElementById('edit-link').value = opp.link;
                document.getElementById('edit-description').value = opp.description;
                elements.editModal.classList.add('active');
            }
        } 
        
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm("Are you sure you want to delete this opportunity?")) {
                const row = deleteBtn.closest('.card');
                row.style.opacity = '0.5'; // Loading state
                
                try {
                    await deleteOpportunityFromDB(id);
                    currentOpportunities = currentOpportunities.filter(o => o.id !== id);
                    renderGrid();
                } catch (error) {
                    console.error("Error deleting: ", error);
                    alert("Failed to delete opportunity. Please try again.");
                    row.style.opacity = '1'; // Revert visual loading state
                }
            }
        }
    });
}

// --- UTILS ---
// Basic XSS prevention for rendering inputs
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
