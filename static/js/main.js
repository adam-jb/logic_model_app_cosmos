console.log('Script loaded');

// Initialize Cytoscape instance
const cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
        {
            selector: 'node',
            style: {
                'background-color': '#FECACA',
                'label': 'data(label)',
                'text-wrap': 'wrap',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-max-width': '150px',  // Maximum width for text
                'width': 'label',           // Width will fit the text
                'height': 'label',          // Height will fit the text
                'padding': '20px',          // Padding around the text
                'shape': 'rectangle',
                'font-size': '14px',        // Adjust font size as needed
                'text-margin-y': '5px'      // Margin for text inside node
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#666',
                'target-arrow-color': '#666',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        },
        {
            selector: 'edge[strength="high"]',
            style: {
                'line-color': '#2ECC71',
                'target-arrow-color': '#2ECC71',
                'width': 3
            }
        },
        {
            selector: 'edge[strength="medium"]',
            style: {
                'line-color': '#F1C40F',
                'target-arrow-color': '#F1C40F',
                'width': 2
            }
        },
        {
            selector: 'edge[strength="low"]',
            style: {
                'line-color': '#E74C3C',
                'target-arrow-color': '#E74C3C',
                'width': 1
            }
        }
    ],
    layout: {
        name: 'grid'
    },
    userZoomingEnabled: true,
    userPanningEnabled: true
});

// Get username from URL
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('user') || 'demo';

// Modal elements
const modal = document.getElementById('editModal');
const modalTitle = document.getElementById('modalTitle');
const elementLabel = document.getElementById('elementLabel');
const elementEvidence = document.getElementById('elementEvidence');
const elementStrength = document.getElementById('elementStrength');
const modalClose = document.getElementById('modalClose');
const modalSave = document.getElementById('modalSave');

let currentElement = null;

// Store models globally
let availableModels = [];

// Load models from server
async function loadModels() {
    console.log('Loading models for user:', username);  // Debug line
    
    try {
        const response = await fetch(`/api/models?user=${username}`);
        availableModels = await response.json();
        
        const selector = document.getElementById('modelSelector');
        // Clear existing options except "Create new model"
        selector.innerHTML = '<option value="new">Create new model</option>';
        

        // Add all available models to selector
        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            selector.appendChild(option);
        });

        // Default to first model in the list
        if (availableModels.length > 0) {
            selector.value = availableModels[0].id;
            loadModel(availableModels[0]);
        }
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

// Load specific model
function loadModel(model) {
    cy.elements().remove();
    
    model.nodes.forEach(node => {
        cy.add({
            group: 'nodes',
            data: { 
                id: node.id,
                label: node.label,
                type: node.type,
                evidence: node.evidence || ''
            }
        });
    });

    model.edges.forEach(edge => {
        cy.add({
            group: 'edges',
            data: {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                evidence: edge.evidence || '',
                strength: edge.strength || 'medium'
            }
        });
    });

    cy.layout({ name: 'grid' }).run();
}

// Add new node
let nodeCounter = 1;
document.getElementById('addNodeBtn').addEventListener('click', () => {
    const node = cy.add({
        group: 'nodes',
        data: { 
            id: `n${Date.now()}`,
            label: `New Node ${nodeCounter++}`,
            evidence: ''
        },
        position: { x: 100, y: 100 }
    });

    openEditModal(node);
});

// Model selector change handler
document.getElementById('modelSelector').addEventListener('change', (e) => {
    const modelNameInput = document.getElementById('modelName');
    if (e.target.value === 'new') {
        modelNameInput.classList.remove('hidden');
        cy.elements().remove();
        nodeCounter = 1;
    } else {
        modelNameInput.classList.add('hidden');
        const selectedModel = availableModels.find(model => model.id === e.target.value);
        if (selectedModel) {
            loadModel(selectedModel);
        }
    }
});

// Edit modal functionality
function openEditModal(element) {
    currentElement = element;
    modal.classList.remove('hidden');
    
    const isEdge = element.isEdge();
    modalTitle.textContent = isEdge ? 'Edit Connection' : 'Edit Node';
    document.querySelector('.edge-only').classList.toggle('hidden', !isEdge);
    
    elementLabel.value = element.data('label') || '';
    elementEvidence.value = element.data('evidence') || '';
    if (isEdge) {
        elementStrength.value = element.data('strength') || 'medium';
    }
}

modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
    currentElement = null;
});

modalSave.addEventListener('click', () => {
    if (!currentElement) return;
    
    const isEdge = currentElement.isEdge();
    currentElement.data('label', elementLabel.value);
    currentElement.data('evidence', elementEvidence.value);
    
    if (isEdge) {
        currentElement.data('strength', elementStrength.value);
    }
    
    modal.classList.add('hidden');
    currentElement = null;
});

// Edge creation mode
let edgeSource = null;

cy.on('tap', 'node', function(evt) {
    if (!edgeSource) {
        edgeSource = evt.target;
        evt.target.style('background-color', '#E74C3C');
    } else {
        const edge = cy.add({
            group: 'edges',
            data: {
                id: `e${Date.now()}`,
                source: edgeSource.id(),
                target: evt.target.id(),
                strength: 'medium'
            }
        });
        
        edgeSource.style('background-color', '#6EA5E0');
        edgeSource = null;
        
        openEditModal(edge);
    }
});

cy.on('tap', function(evt) {
    if (evt.target === cy) {
        if (edgeSource) {
            edgeSource.style('background-color', '#6EA5E0');
            edgeSource = null;
        }
    }
});

// Double click to edit
cy.on('dbltap', 'node, edge', function(evt) {
    openEditModal(evt.target);
});


// Submit changes
document.getElementById('submitBtn').addEventListener('click', async () => {
    const modelSelector = document.getElementById('modelSelector');
    const modelNameInput = document.getElementById('modelName');
    
    let modelId = modelSelector.value;
    let modelName = '';
    
    if (modelId === 'new') {
        modelName = modelNameInput.value.trim();
        if (!modelName) {
            alert('Please enter a name for the new model');
            return;
        }
        modelId = `model-${Date.now()}`;
    } else {
        // Use existing model name if not new
        const existingModel = availableModels.find(m => m.id === modelId);
        modelName = existingModel ? existingModel.name : 'Logic Model';
    }

    const modelData = {
        id: modelId,
        name: modelName,
        nodes: cy.nodes().map(node => ({
            id: node.id(),
            label: node.data('label'),
            evidence: node.data('evidence')
        })),
        edges: cy.edges().map(edge => ({
            id: edge.id(),
            source: edge.data('source'),
            target: edge.data('target'),
            evidence: edge.data('evidence'),
            strength: edge.data('strength')
        }))
    };

    try {
        const response = await fetch(`/api/models?user=${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modelData)
        });
        
        if (response.ok) {
            alert('Model saved successfully!');
            // Refresh the models list
            await loadModels();
        } else {
            alert('Error saving model');
        }
    } catch (error) {
        console.error('Error saving model:', error);
        alert('Error saving model');
    }
});

// Load models when page loads
loadModels();