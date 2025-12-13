/**
 * ETERNA LUXE - Settings Page JavaScript
 * =======================================
 * Complete implementation for customer settings with localStorage persistence
 * Handles: Profile, Security, Addresses, Payments, Notifications, Theme, Permissions, Data
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const local = window.localStorage;

/**
 * Show temporary toast notification
 * @param {string} msg - Message to display
 * @param {number} ms - Duration in milliseconds
 */
function showToast(msg, ms = 1400) {
  const t = document.createElement('div');
  t.className = 'settings-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => (t.style.opacity = '0'), ms - 300);
  setTimeout(() => t.remove(), ms);
}

/**
 * Toggle switch state
 * @param {HTMLElement} el - Toggle element
 * @param {boolean} on - State to set
 */
function setToggle(el, on) {
  if (on) el.classList.add('on');
  else el.classList.remove('on');
}

/**
 * Open modal dialog
 * @param {string} html - Modal content HTML
 */
window.openModal = (html) => {
  $('#modalContent').innerHTML = html;
  $('#modalBackdrop').classList.add('show');
  $('#modalBackdrop').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#modalBackdrop').querySelector('input')?.focus(), 200);
};

/**
 * Close modal dialog
 */
window.closeModal = () => {
  $('#modalBackdrop').classList.remove('show');
  $('#modalBackdrop').setAttribute('aria-hidden', 'true');
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const defaults = {
  profile: {
    username: 'jane_doe',
    fullname: 'Jane Doe',
    email: 'jane@eternaluxe.com',
    phone: '+1 555 0123',
    birthday: '1990-08-12',
    gender: ''
  },
  addresses: [
    {
      id: 1,
      name: 'Home',
      address: '123 Elm Street, Apt 4',
      city: 'San Francisco',
      zip: '94107',
      default: true
    },
    {
      id: 2,
      name: 'Office',
      address: '500 Market St',
      city: 'San Francisco',
      zip: '94103',
      default: false
    }
  ],
  cards: [
    {
      id: 1,
      brand: 'Visa',
      last4: '4242',
      expiry: '12/25',
      default: true,
      billing: '123 Elm Street'
    },
    {
      id: 2,
      brand: 'Mastercard',
      last4: '5555',
      expiry: '08/26',
      default: false,
      billing: '500 Market St'
    }
  ],
  devices: [
    { id: 'd1', label: 'Chrome — Windows', when: 'Today • 08:12', ip: '192.168.1.8' },
    { id: 'd2', label: 'iPhone Safari', when: 'Yesterday • 23:00', ip: '192.168.1.11' }
  ],
  savedSearches: ['Black dress', 'Cashmere sweater'],
  storage: { usedGB: 2.4, limitGB: 10 }
};

/**
 * Load all state from localStorage with defaults
 * @returns {Object} Complete state object
 */
function loadState() {
  return {
    profile: JSON.parse(local.getItem('profile') || JSON.stringify(defaults.profile)),
    addresses: JSON.parse(local.getItem('addresses') || JSON.stringify(defaults.addresses)),
    cards: JSON.parse(local.getItem('cards') || JSON.stringify(defaults.cards)),
    devices: JSON.parse(local.getItem('devices') || JSON.stringify(defaults.devices)),
    savedSearches: JSON.parse(
      local.getItem('savedSearches') || JSON.stringify(defaults.savedSearches)
    ),
    storage: JSON.parse(local.getItem('storage') || JSON.stringify(defaults.storage))
  };
}

/**
 * Save state to localStorage
 * @param {Object} state - State object to save
 */
function saveState(state) {
  local.setItem('profile', JSON.stringify(state.profile));
  local.setItem('addresses', JSON.stringify(state.addresses));
  local.setItem('cards', JSON.stringify(state.cards));
  local.setItem('devices', JSON.stringify(state.devices));
  local.setItem('savedSearches', JSON.stringify(state.savedSearches));
  local.setItem('storage', JSON.stringify(state.storage));
}

// Load state on page init
const state = loadState();

// ============================================================================
// 1. NAVIGATION & TAB SWITCHING
// ============================================================================

$$('#nav button').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    // Remove active class from all buttons
    $$('#nav button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Show corresponding panel
    const tab = btn.dataset.tab;
    $$('[data-panel]').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab));

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ============================================================================
// 2. PROFILE SETTINGS
// ============================================================================

/**
 * Populate profile form with current data
 */
function populateProfile() {
  $('#username').value = state.profile.username;
  $('#fullname').value = state.profile.fullname;
  $('#email').value = state.profile.email;
  $('#phone').value = state.profile.phone;
  $('#birthday').value = state.profile.birthday;
  $('#gender').value = state.profile.gender;

  // Show avatar or default
  const avatar = local.getItem('avatar') || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23efeef5"/><text x="50%" y="55%" text-anchor="middle" font-size="40" fill="%238b7d6b">EL</text></svg>';
  $('#avatarPreview').innerHTML = '<img src="' + avatar + '"/>';
}

// Initial profile population
populateProfile();

/**
 * Handle profile picture upload
 */
$('#profilePic').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    local.setItem('avatar', reader.result);
    populateProfile();
  };
  reader.readAsDataURL(file);
});

/**
 * Save profile changes
 */
$('#saveProfile').addEventListener('click', () => {
  state.profile.username = $('#username').value;
  state.profile.fullname = $('#fullname').value;
  state.profile.email = $('#email').value;
  state.profile.phone = $('#phone').value;
  state.profile.birthday = $('#birthday').value;
  state.profile.gender = $('#gender').value;
  saveState(state);
  showToast('Profile saved');
});

/**
 * Reset profile to defaults
 */
$('#resetProfile').addEventListener('click', () => {
  Object.assign(state.profile, defaults.profile);
  saveState(state);
  populateProfile();
  showToast('Profile reset');
});

// ============================================================================
// 3. LOGIN & SECURITY
// ============================================================================

/**
 * Render device list dynamically
 */
function renderDevices() {
  const list = $('#deviceList');
  list.innerHTML = '';

  state.devices.forEach((d) => {
    const el = document.createElement('div');
    el.className = 'settings-card';
    el.style.marginTop = '8px';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
        <div>
          <div style="font-weight:600">${d.label}</div>
          <div class="settings-muted-sm">${d.when} • ${d.ip}</div>
        </div>
        <button class="settings-action-btn" data-id="${d.id}">End</button>
      </div>
    `;
    list.appendChild(el);
  });

  // Attach event listeners to delete buttons
  $$('#deviceList .settings-action-btn').forEach((btn) => {
    btn.onclick = () => {
      state.devices = state.devices.filter((x) => x.id !== btn.dataset.id);
      saveState(state);
      renderDevices();
      showToast('Session ended');
    };
  });
}

// Initial render
renderDevices();

/**
 * Two-step verification toggle
 */
const twofaEl = $('#twofa');
const twofaOn = local.getItem('twofa') === 'true';
setToggle(twofaEl, twofaOn);

twofaEl.addEventListener('click', () => {
  const on = !twofaEl.classList.contains('on');
  setToggle(twofaEl, on);
  local.setItem('twofa', on);
  showToast('Two-step verification ' + (on ? 'enabled' : 'disabled'));
});

/**
 * Logout all devices
 */
$('#logoutAll').addEventListener('click', () => {
  state.devices = [];
  saveState(state);
  renderDevices();
  showToast('All devices logged out');
});

/**
 * Delete account modal with confirmation
 */
$('#deleteAccount').addEventListener('click', () =>
  openModal(`
    <h3>Delete account</h3>
    <div class="settings-muted-sm">This is permanent. Type <strong>DELETE</strong> to confirm.</div>
    <div style="margin-top:12px">
      <input id="confirmDelete" placeholder="Type DELETE" 
        style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:12px;gap:8px">
      <button class="settings-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="settings-btn" id="confirmDeleteBtn">Delete</button>
    </div>
  `)
);

/**
 * Confirm account deletion
 */
document.addEventListener('click', (e) => {
  if (e.target?.id === 'confirmDeleteBtn') {
    const val = $('#confirmDelete').value.trim();
    if (val === 'DELETE') {
      local.clear();
      showToast('Account deleted');
      closeModal();
      // Redirect after delay
      setTimeout(() => (window.location.href = './login.html'), 2000);
    } else {
      showToast('Please type DELETE');
    }
  }
});

/**
 * Change password modal
 */
$('#changePasswordBtn').addEventListener('click', () =>
  openModal(`
    <h3>Change password</h3>
    <div style="display:grid;gap:8px">
      <input id="oldPass" type="password" placeholder="Current password" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="newPass" type="password" placeholder="New password" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="newPass2" type="password" placeholder="Confirm password" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
      <button class="settings-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="settings-btn" id="doChangePass">Save</button>
    </div>
  `)
);

/**
 * Process password change
 */
document.addEventListener('click', (e) => {
  if (e.target?.id === 'doChangePass') {
    const oldPass = $('#oldPass')?.value;
    const newPass = $('#newPass')?.value;
    const newPass2 = $('#newPass2')?.value;

    if (!oldPass || !newPass || !newPass2) {
      showToast('Fill in all fields');
      return;
    }
    if (newPass !== newPass2) {
      showToast('Passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    // Save password to localStorage (demo only - never do this in production!)
    local.setItem('password_hash', btoa(newPass));
    showToast('Password changed');
    closeModal();
  }
});

// ============================================================================
// 4. ADDRESS BOOK
// ============================================================================

/**
 * Render addresses dynamically
 */
function renderAddresses() {
  const wrap = $('#addresses');
  wrap.innerHTML = '';

  state.addresses.forEach((a) => {
    const el = document.createElement('div');
    el.className = 'settings-address-card';
    el.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;width:100%">
        <div style="flex:1">
          <div style="display:flex;gap:8px;align-items:center">
            <div style="font-weight:700">${a.name}</div>
            ${a.default ? '<div class="settings-chip">Default</div>' : ''}
          </div>
          <div class="settings-muted-sm">${a.address}</div>
          <div class="settings-muted-sm">${a.city} • ${a.zip}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="settings-action-btn" data-edit="${a.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="settings-action-btn" data-delete="${a.id}"><i class="fa-solid fa-trash"></i></button>
          <button class="settings-action-btn" data-default="${a.id}"><i class="fa-solid fa-check"></i></button>
        </div>
      </div>
    `;
    wrap.appendChild(el);
  });

  // Edit address
  $$('[data-edit]').forEach((b) => {
    b.onclick = () => openAddressModal(state.addresses.find((x) => x.id == b.dataset.edit));
  });

  // Delete address
  $$('[data-delete]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.delete;
      state.addresses = state.addresses.filter((x) => x.id != id);
      saveState(state);
      renderAddresses();
      showToast('Address deleted');
    };
  });

  // Set as default
  $$('[data-default]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.default;
      state.addresses = state.addresses.map((x) => ({
        ...x,
        default: String(x.id) === id
      }));
      saveState(state);
      renderAddresses();
      showToast('Default address set');
    };
  });
}

// Initial render
renderAddresses();

/**
 * Open address modal (add or edit)
 * @param {Object} addr - Address to edit (undefined for new)
 */
function openAddressModal(addr) {
  const editing = !!addr;
  openModal(`
    <h3>${editing ? 'Edit' : 'Add'} address</h3>
    <div style="display:grid;gap:8px">
      <input id="addrName" placeholder="Label (Home, Office)" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="addrLine" placeholder="Street address" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="addrCity" placeholder="City" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="addrZip" placeholder="Postal code" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
      <button class="settings-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="settings-btn" id="saveAddr">${editing ? 'Save' : 'Add'}</button>
    </div>
  `);

  // Pre-fill if editing
  if (editing) {
    $('#addrName').value = addr.name;
    $('#addrLine').value = addr.address;
    $('#addrCity').value = addr.city;
    $('#addrZip').value = addr.zip;
  }

  // Save handler
  $('#saveAddr').onclick = () => {
    const obj = {
      id: editing ? addr.id : Date.now(),
      name: $('#addrName').value || 'Address',
      address: $('#addrLine').value,
      city: $('#addrCity').value,
      zip: $('#addrZip').value,
      default: false
    };

    if (editing) {
      state.addresses = state.addresses.map((a) => (a.id === addr.id ? obj : a));
    } else {
      state.addresses.push(obj);
    }

    saveState(state);
    renderAddresses();
    closeModal();
    showToast('Address saved');
  };
}

/**
 * Add new address button
 */
$('#addAddressBtn').addEventListener('click', () => openAddressModal());

// ============================================================================
// 5. PAYMENT METHODS
// ============================================================================

/**
 * Render payment cards dynamically
 */
function renderCards() {
  const wrap = $('#cards');
  wrap.innerHTML = '';

  state.cards.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'settings-card';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex:1">
        <i class="fa-regular fa-credit-card" style="font-size:22px"></i>
        <div>
          <div style="font-weight:600">${c.brand} • • • • ${c.last4}</div>
          <div class="settings-muted-sm">Expires ${c.expiry}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="settings-action-btn" data-default="${c.id}">${
      c.default ? '✓' : ''
    }</button>
        <button class="settings-action-btn" data-delete="${c.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    wrap.appendChild(el);
  });

  // Delete card
  $$('[data-delete]').forEach((b) => {
    b.onclick = () => {
      state.cards = state.cards.filter((x) => x.id != b.dataset.delete);
      saveState(state);
      renderCards();
      showToast('Card removed');
    };
  });

  // Set as default
  $$('[data-default]').forEach((b) => {
    b.onclick = () => {
      state.cards = state.cards.map((x) => ({
        ...x,
        default: String(x.id) === b.dataset.default
      }));
      saveState(state);
      renderCards();
      showToast('Default payment method set');
    };
  });
}

// Initial render
renderCards();

/**
 * Add card modal
 */
$('#addCardBtn').addEventListener('click', () =>
  openModal(`
    <h3>Add card</h3>
    <div style="display:grid;gap:8px">
      <input id="cardBrand" placeholder="Card brand (Visa)" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="cardLast4" placeholder="Last 4 digits" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="cardExpiry" placeholder="MM/YY" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <input id="cardBilling" placeholder="Billing address" 
        style="padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
      <button class="settings-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="settings-btn" id="saveCardBtn">Add</button>
    </div>
  `)
);

/**
 * Save new card
 */
document.addEventListener('click', (e) => {
  if (e.target?.id === 'saveCardBtn') {
    const card = {
      id: Date.now(),
      brand: $('#cardBrand').value || 'Card',
      last4: $('#cardLast4').value || '0000',
      expiry: $('#cardExpiry').value || '--/--',
      default: false,
      billing: $('#cardBilling').value || ''
    };
    state.cards.push(card);
    saveState(state);
    renderCards();
    closeModal();
    showToast('Card added');
  }
});

/**
 * Cash on delivery toggle
 */
const codToggle = $('#codToggle');
setToggle(codToggle, local.getItem('cod') === 'true');
codToggle.addEventListener('click', () => {
  const v = !codToggle.classList.contains('on');
  setToggle(codToggle, v);
  local.setItem('cod', v);
  showToast('Saved');
});

// ============================================================================
// 6. ORDERS & SHOPPING PREFERENCES
// ============================================================================

/**
 * Render saved searches
 */
function renderSavedSearches() {
  const wrap = $('#savedSearches');
  wrap.innerHTML = '';

  state.savedSearches.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'settings-chip';
    el.innerHTML = `
      ${s} 
      <button class="settings-icon-btn" data-remove="${i}" 
        style="margin-left:8px;background:none;border:none;padding:0;cursor:pointer">×</button>
    `;
    wrap.appendChild(el);
  });

  $$('[data-remove]').forEach((b) => {
    b.onclick = (e) => {
      e.preventDefault();
      state.savedSearches.splice(parseInt(b.dataset.remove), 1);
      saveState(state);
      renderSavedSearches();
      showToast('Removed');
    };
  });
}

// Initial render
renderSavedSearches();

/**
 * Shopping preferences
 */
$('#defaultSort').addEventListener('change', () =>
  local.setItem('sortPref', $('#defaultSort').value)
);
$('#deliveryMethod').addEventListener('change', () =>
  local.setItem('deliveryPref', $('#deliveryMethod').value)
);
$('#wishlistVisibility').addEventListener('change', () =>
  local.setItem('wishlistVis', $('#wishlistVisibility').value)
);

const autoVoucher = $('#autoVoucher');
setToggle(autoVoucher, local.getItem('autoVoucher') === 'true');
autoVoucher.addEventListener('click', () => {
  const v = !autoVoucher.classList.contains('on');
  setToggle(autoVoucher, v);
  local.setItem('autoVoucher', v);
  showToast('Saved');
});

// ============================================================================
// 7. NOTIFICATIONS
// ============================================================================

/**
 * Notification preference toggles
 */
$$('.settings-toggle[data-pref]').forEach((t) => {
  const key = 'notif_' + t.dataset.pref;
  setToggle(t, local.getItem(key) === 'true');

  t.addEventListener('click', () => {
    const v = !t.classList.contains('on');
    setToggle(t, v);
    local.setItem(key, v);
    showToast('Notification preference saved');
  });
});

/**
 * Push notifications toggle
 */
const pushToggle = $('#pushPerm');
setToggle(pushToggle, Notification && Notification.permission === 'granted');

pushToggle.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    return showToast('Notifications not supported');
  }

  const p = await Notification.requestPermission();
  setToggle(pushToggle, p === 'granted');
  showToast('Permission: ' + p);
});

// ============================================================================
// 8. APPEARANCE & THEME
// ============================================================================

/**
 * Apply theme to document
 * @param {string} theme - 'light', 'dark', or 'system'
 */
function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    const dark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches;
    document.querySelector('.settings-page').setAttribute('data-theme', dark ? 'dark' : 'light');
    local.setItem('theme', 'system');
  } else {
    document.querySelector('.settings-page').setAttribute('data-theme', theme);
    local.setItem('theme', theme);
  }
}

/**
 * Theme buttons
 */
$('#lightBtn').addEventListener('click', () => applyTheme('light'));
$('#darkBtn').addEventListener('click', () => applyTheme('dark'));
$('#systemBtn').addEventListener('click', () => applyTheme('system'));

/**
 * Accent color picker
 */
const accentPicker = $('#accentPicker');
accentPicker.addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--settings-accent', e.target.value);
  local.setItem('accent', e.target.value);
});

// Load saved theme
const savedTheme = local.getItem('theme') || 'light';
if (savedTheme === 'system') applyTheme('system');
else applyTheme(savedTheme);

const savedAccent = local.getItem('accent');
if (savedAccent) {
  accentPicker.value = savedAccent;
  document.documentElement.style.setProperty('--settings-accent', savedAccent);
}

// ============================================================================
// 9. LANGUAGE & REGION
// ============================================================================

/**
 * Language & region preferences
 */
$('#language').addEventListener('change', () =>
  local.setItem('lang', $('#language').value)
);
$('#region').addEventListener('change', () =>
  local.setItem('region', $('#region').value)
);
$('#currency').addEventListener('change', () =>
  local.setItem('currency', $('#currency').value)
);

// Restore saved preferences
if (local.getItem('lang')) $('#language').value = local.getItem('lang');
if (local.getItem('region')) $('#region').value = local.getItem('region');
if (local.getItem('currency')) $('#currency').value = local.getItem('currency');

// ============================================================================
// 10. PRIVACY SETTINGS
// ============================================================================

/**
 * Privacy toggles
 */
['hidePurchase', 'hideReviews', 'personalizedAds', 'analyticsToggle'].forEach((id) => {
  const el = $('#' + id);
  setToggle(el, local.getItem(id) === 'true');

  el.addEventListener('click', () => {
    const on = !el.classList.contains('on');
    setToggle(el, on);
    local.setItem(id, on);
    showToast('Privacy setting saved');
  });
});

// ============================================================================
// 11. APP PERMISSIONS
// ============================================================================

/**
 * Update permission status from browser
 * @param {string} elementId - Element to update
 * @param {string} permissionName - Permission name (geolocation, camera, notifications)
 */
async function updatePermStatus(elementId, permissionName) {
  const el = $(elementId);

  try {
    if (!navigator.permissions) {
      el.textContent = 'Unavailable';
      return;
    }

    const permission = await navigator.permissions.query({ name: permissionName });
    el.textContent = permission.state.charAt(0).toUpperCase() + permission.state.slice(1);
  } catch (e) {
    el.textContent = 'Unknown';
  }
}

// Check initial permission statuses
updatePermStatus('#permLocation', 'geolocation');
updatePermStatus('#permCamera', 'camera');
updatePermStatus('#permNotify', 'notifications');

/**
 * Request location permission
 */
$('#askLocation').addEventListener('click', () => {
  navigator.geolocation?.getCurrentPosition(
    () => updatePermStatus('#permLocation', 'geolocation'),
    () => updatePermStatus('#permLocation', 'geolocation')
  );
});

/**
 * Request camera permission
 */
$('#askCamera').addEventListener('click', async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    updatePermStatus('#permCamera', 'camera');
  } catch (e) {
    updatePermStatus('#permCamera', 'camera');
  }
});

/**
 * Request notification permission
 */
$('#askNotify').addEventListener('click', async () => {
  if (Notification) {
    await Notification.requestPermission();
  }
  updatePermStatus('#permNotify', 'notifications');
});

// ============================================================================
// 12. DATA & STORAGE
// ============================================================================

/**
 * Update storage UI
 */
function updateStorageUI() {
  const s = state.storage;
  const percent = (s.usedGB / s.limitGB) * 100;
  $('#storageFill').style.width = percent + '%';
  $('#storageInfo').textContent = `Using ${s.usedGB}GB of ${s.limitGB}GB`;
}

// Initial update
updateStorageUI();

/**
 * Download user data as JSON
 */
$('#downloadData').addEventListener('click', () => {
  const data = {
    profile: state.profile,
    addresses: state.addresses,
    cards: state.cards
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eternaluxe-data.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  showToast('Data downloaded');
});

/**
 * Clear cache and reset
 */
$('#clearCacheBtn').addEventListener('click', () => {
  localStorage.clear();
  sessionStorage.clear();
  showToast('Cache cleared');
  setTimeout(() => location.reload(), 1000);
});

// ============================================================================
// 13. SUPPORT & HELP
// ============================================================================

/**
 * Send support message
 */
$('#sendSupport').addEventListener('click', () => {
  const subj = $('#supportSubject').value.trim();
  const msg = $('#supportMessage').value.trim();

  if (!subj || !msg) {
    $('#supportResult').textContent = 'Please fill in both fields';
    return;
  }

  $('#supportResult').textContent = 'Sending...';

  // Simulate sending
  setTimeout(() => {
    $('#supportResult').textContent =
      'Message sent! We will reply within 24 hours. Ticket ID: #' + Date.now();
    $('#supportForm').reset();
  }, 900);
});

/**
 * Report issue
 */
$('#reportIssue').addEventListener('click', () => {
  showToast('Issue reported. Thank you for helping us improve!');
});

/**
 * Support link in sidebar
 */
$('#openSupport').addEventListener('click', (e) => {
  e.preventDefault();
  $$('#nav button').forEach((b) => b.classList.remove('active'));
  $('#nav button[data-tab="support"]').classList.add('active');
  $$('[data-panel]').forEach((p) => p.classList.remove('active'));
  $('[data-panel="support"]').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================================================
// 14. GLOBAL EVENT LISTENERS
// ============================================================================

/**
 * Close modal on Escape key
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/**
 * Close modal on backdrop click
 */
$('#modalBackdrop').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ============================================================================
// INITIALIZATION COMPLETE
// ============================================================================

console.log('✅ Settings page initialized with full functionality');
console.log('📊 Loaded state:', state);
console.log('💾 LocalStorage keys:', Object.keys(localStorage));
