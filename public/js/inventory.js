// Consumables Inventory System
import { getVersionedData, saveVersionedData } from './storage.js';

// Add new inventory item
export function addInventoryItem(item) {
    const data = getVersionedData();

    if (!data.inventory) {
        data.inventory = { items: [] };
    }

    const newItem = {
        id: 'inv-' + Date.now(),
        category: item.category || 'other',
        name: item.name,
        count: item.count || 0,
        threshold: item.threshold || 1,
        linkedTask: item.linkedTask || null
    };

    data.inventory.items.push(newItem);
    saveVersionedData(data);

    return newItem;
}

// Update inventory item
export function updateInventoryItem(itemId, updates) {
    const data = getVersionedData();

    if (!data.inventory) {
        return false;
    }

    const item = data.inventory.items.find(i => i.id === itemId);
    if (!item) {
        return false;
    }

    Object.assign(item, updates);
    saveVersionedData(data);

    return true;
}

// Delete inventory item
export function deleteInventoryItem(itemId) {
    const data = getVersionedData();

    if (!data.inventory) {
        return false;
    }

    const index = data.inventory.items.findIndex(i => i.id === itemId);
    if (index === -1) {
        return false;
    }

    data.inventory.items.splice(index, 1);
    saveVersionedData(data);

    return true;
}

// Increment item count
export function incrementInventory(itemId) {
    const data = getVersionedData();

    if (!data.inventory) {
        return false;
    }

    const item = data.inventory.items.find(i => i.id === itemId);
    if (!item) {
        return false;
    }

    item.count++;
    saveVersionedData(data);

    return true;
}

// Decrement item count
export function decrementInventory(itemId) {
    const data = getVersionedData();

    if (!data.inventory) {
        return false;
    }

    const item = data.inventory.items.find(i => i.id === itemId);
    if (!item || item.count <= 0) {
        return false;
    }

    item.count--;
    saveVersionedData(data);

    return true;
}

// Get items that need restocking
export function getRestockAlerts() {
    const data = getVersionedData();

    if (!data.inventory) {
        return [];
    }

    return data.inventory.items.filter(item => item.count <= item.threshold);
}

// Get inventory item by linked task
export function getItemByTask(taskId) {
    const data = getVersionedData();

    if (!data.inventory) {
        return null;
    }

    return data.inventory.items.find(item => item.linkedTask === taskId);
}

// Render inventory list
export function renderInventory() {
    const container = document.getElementById('inventoryList');
    if (!container) return;

    const data = getVersionedData();
    const items = data.inventory?.items || [];

    if (items.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding: 20px; text-align: center;">No items in inventory. Add items below.</p>';
        return;
    }

    container.innerHTML = '';

    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'inventory-card';
        itemCard.innerHTML = `
            <div class="inventory-header">
                <div class="inventory-name">${item.name}</div>
                <button class="btn-icon-edit" onclick="window.editInventoryItem('${item.id}')" title="Edit">✎</button>
            </div>
            <div class="inventory-details">
                <span class="inventory-category">${getCategoryLabel(item.category)}</span>
                ${item.linkedTask ? '<span class="inventory-linked">🔗 Auto-tracked</span>' : ''}
            </div>
            <div class="inventory-controls">
                <button class="btn-count" onclick="window.decrementInventoryItem('${item.id}')">−</button>
                <span class="inventory-count ${item.count <= item.threshold ? 'low-stock' : ''}">${item.count}</span>
                <button class="btn-count" onclick="window.incrementInventoryItem('${item.id}')">+</button>
            </div>
            <div class="inventory-threshold">Restock at ${item.threshold}</div>
        `;
        container.appendChild(itemCard);
    });
}

// Get category label
function getCategoryLabel(category) {
    const labels = {
        strings: 'Strings',
        picks: 'Picks',
        cleaning: 'Cleaning',
        humidification: 'Humidification',
        batteries: 'Batteries',
        other: 'Other'
    };
    return labels[category] || 'Other';
}

// Show add/edit modal
export function showInventoryModal(itemId = null) {
    const modal = document.getElementById('inventoryModal');
    if (!modal) return;

    const modalTitle = document.getElementById('inventoryModalTitle');
    const form = document.getElementById('inventoryForm');

    if (itemId) {
        // Edit mode
        const data = getVersionedData();
        const item = data.inventory?.items.find(i => i.id === itemId);

        if (!item) return;

        if (modalTitle) modalTitle.textContent = 'Edit Inventory Item';

        document.getElementById('inventoryName').value = item.name;
        document.getElementById('inventoryCategory').value = item.category;
        document.getElementById('inventoryCount').value = item.count;
        document.getElementById('inventoryThreshold').value = item.threshold;
        document.getElementById('inventoryLinkedTask').value = item.linkedTask || '';

        form.dataset.itemId = itemId;
    } else {
        // Add mode
        if (modalTitle) modalTitle.textContent = 'Add Inventory Item';

        document.getElementById('inventoryName').value = '';
        document.getElementById('inventoryCategory').value = 'other';
        document.getElementById('inventoryCount').value = '0';
        document.getElementById('inventoryThreshold').value = '1';
        document.getElementById('inventoryLinkedTask').value = '';

        delete form.dataset.itemId;
    }

    modal.classList.add('show');
}

// Hide inventory modal
export function hideInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    if (modal) modal.classList.remove('show');
}

// Save inventory item from form
export function saveInventoryFromForm() {
    const form = document.getElementById('inventoryForm');
    const itemId = form.dataset.itemId;

    const item = {
        name: document.getElementById('inventoryName').value.trim(),
        category: document.getElementById('inventoryCategory').value,
        count: parseInt(document.getElementById('inventoryCount').value) || 0,
        threshold: parseInt(document.getElementById('inventoryThreshold').value) || 1,
        linkedTask: document.getElementById('inventoryLinkedTask').value || null
    };

    if (!item.name) {
        alert('Please enter an item name');
        return;
    }

    if (itemId) {
        // Update existing item
        updateInventoryItem(itemId, item);
    } else {
        // Add new item
        addInventoryItem(item);
    }

    hideInventoryModal();
    renderInventory();
    updateRestockAlerts();
}

// Update restock alerts display
export function updateRestockAlerts() {
    const alerts = getRestockAlerts();
    const container = document.getElementById('restockAlertBanner');

    if (!container) return;

    if (alerts.length === 0) {
        container.style.display = 'none';
        return;
    }

    const itemList = alerts.map(item => `${item.name} (${item.count} left)`).join(', ');

    container.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">⚠️</span>
            <span class="alert-text">Restock needed: ${itemList}</span>
            <button class="alert-dismiss" onclick="window.dismissRestockAlert()">×</button>
        </div>
    `;

    container.style.display = 'block';
}

// Expose functions to window
if (typeof window !== 'undefined') {
    window.addInventoryItem = addInventoryItem;
    window.editInventoryItem = showInventoryModal;
    window.deleteInventoryItem = deleteInventoryItem;
    window.incrementInventoryItem = (id) => {
        incrementInventory(id);
        renderInventory();
        updateRestockAlerts();
    };
    window.decrementInventoryItem = (id) => {
        decrementInventory(id);
        renderInventory();
        updateRestockAlerts();
    };
    window.showInventoryModal = showInventoryModal;
    window.hideInventoryModal = hideInventoryModal;
    window.saveInventoryFromForm = saveInventoryFromForm;
    window.dismissRestockAlert = () => {
        const container = document.getElementById('restockAlertBanner');
        if (container) container.style.display = 'none';
    };
}
