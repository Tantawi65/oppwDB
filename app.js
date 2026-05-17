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

// --- MOCK DATABASE STATE (For demonstration without API keys) ---
let localOpportunities = [
    {
        id: '1',
        title: 'Frontend Developer Intern',
        category: 'internship',
        deadline: '2026-06-30',
        link: 'https://example.com/apply1',
        description: 'Join our energetic startup working on cutting-edge Web3 interfaces.',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        id: '2',
        title: 'Global Cyber Hackathon',
        category: 'hackathon',
        deadline: '2026-05-20', // Very soon
        link: 'https://example.com/hack',
        description: '48 hours to build the future of cybersecurity. $50k prize pool.',
        createdAt: new Date().toISOString()
    }
];

// --- APP STATE ---
let currentOpportunities = [];

// --- DOM ELEMENTS ---
const elements = {
    grid: document.getElementById('opportunitiesGrid'),
    filterCategory: document.getElementById('filterCategory'),
    sortOpps: document.getElementById('sortOpps'),
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
    
    
    // MOCK IMPLEMENTATION: Simulate network delay
    return new Promise((resolve) => {
        setTimeout(() => resolve([...localOpportunities]), 600);
    });
}

// 2. Write Data
async function addOpportunityToDB(oppData) {
    
    // SHEETDB IMPLEMENTATION:
    const newRecord = {
        id: Math.random().toString(36).substr(2, 9),
        ...oppData,
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
    
   
    // MOCK IMPLEMENTATION:
    return new Promise((resolve) => {
        setTimeout(() => {
            const newOpp = {
                id: Math.random().toString(36).substr(2, 9),
                ...oppData,
                createdAt: new Date().toISOString()
            };
            localOpportunities.push(newOpp);
            resolve(newOpp);
        }, 500);
    });
}

// 3. Update Data
async function updateOpportunityInDB(id, updatedData) {
    /*
    // SHEETDB IMPLEMENTATION:
    const response = await fetch(`${SHEETDB_URL}/id/${id}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data: updatedData
        })
    });
    if (!response.ok) throw new Error("Failed to update in Google Sheet");
    return updatedData;
    */
    
    // MOCK IMPLEMENTATION:
    return new Promise((resolve) => {
        setTimeout(() => {
            const index = localOpportunities.findIndex(opp => opp.id === id);
            if (index !== -1) {
                localOpportunities[index] = { ...localOpportunities[index], ...updatedData };
            }
            resolve();
        }, 300);
    });
}

// 4. Delete Data
async function deleteOpportunityFromDB(id) {
    /*
    // SHEETDB IMPLEMENTATION:
    const response = await fetch(`${SHEETDB_URL}/id/${id}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error("Failed to delete from Google Sheet");
    */
    
    // MOCK IMPLEMENTATION:
    return new Promise((resolve) => {
        setTimeout(() => {
            localOpportunities = localOpportunities.filter(opp => opp.id !== id);
            resolve();
        }, 300);
    });
}

// --- UI RENDERING ---
function renderGrid() {
    let filtered = [...currentOpportunities];
    
    // 1. Apply Filter
    const category = elements.filterCategory.value;
    if (category !== 'all') {
        filtered = filtered.filter(opp => opp.category === category);
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
    const deadlineDate = new Date(opp.deadline);
    const timeDiff = deadlineDate - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    let deadlineStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(deadlineDate);
    let isUrgent = false;

    if (daysLeft < 0) {
        deadlineStr = "Past due";
        isUrgent = true;
    } else if (daysLeft <= 7) {
        deadlineStr = `${daysLeft} days left (${deadlineStr})`;
        isUrgent = true;
    } else {
        deadlineStr = `Closes ${deadlineStr}`;
    }

    return `
        <article class="card">
            <div class="card-header">
                <span class="badge ${opp.category}">${opp.category}</span>
            </div>
            <h3 class="card-title">${escapeHTML(opp.title)}</h3>
            <p class="card-desc">${escapeHTML(opp.description)}</p>
            <div class="card-actions">
                <button class="btn-icon btn-edit" data-id="${opp.id}">✎ Edit</button>
                <button class="btn-icon btn-delete" data-id="${opp.id}">🗑 Delete</button>
            </div>
            <div class="card-footer">
                <span class="deadline ${isUrgent ? 'urgent' : ''}">
                    ⏱ ${deadlineStr}
                </span>
                <a href="${escapeHTML(opp.link)}" target="_blank" rel="noopener noreferrer" class="card-link">
                    View & Apply ↗
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

    // Handle Edit and Delete button clicks (Event Delegation)
    elements.grid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

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