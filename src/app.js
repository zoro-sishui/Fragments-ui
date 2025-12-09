// src/app.js

import { signIn, getUser, signOut } from './auth';
import { getUserFragments, createFragment, getFragment, updateFragment, deleteFragment, getFragmentConverted, apiUrl } from './api';

// Global user variable
let currentUser = null;

async function displayFragments(user) {
  const fragmentsContainer = document.querySelector('#fragments-container');
  
  try {
    const userFragments = await getUserFragments(user);
    
    if (!userFragments || !userFragments.fragments || userFragments.fragments.length === 0) {
      fragmentsContainer.innerHTML = '<p>No items yet. Create your first one above!</p>';
      return;
    }

    // Clear the container
    fragmentsContainer.innerHTML = '';

    // Display each fragment
    for (const fragment of userFragments.fragments) {
      const fragmentDiv = document.createElement('div');
      fragmentDiv.className = 'fragment-item';
      fragmentDiv.id = `fragment-${fragment.id}`;
      
      // Get base type (remove charset etc)
      const baseType = fragment.type.split(';')[0].trim();
      
      // Define valid conversions
      const validConversions = {
        'text/plain': ['txt'],
        'text/markdown': ['md', 'html', 'txt'],
        'text/html': ['html', 'txt'],
        'text/csv': ['csv', 'txt', 'json'],
        'application/json': ['json', 'yaml', 'yml', 'txt'],
        'application/yaml': ['yaml', 'txt'],
        'image/png': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/jpeg': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/webp': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/avif': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/gif': ['png', 'jpg', 'webp', 'gif', 'avif'],
      };

      const options = validConversions[baseType] || [];
      const optionsHtml = options.map(ext => `<option value="${ext}">.${ext}</option>`).join('');

      fragmentDiv.innerHTML = `
        <div><strong>ID:</strong> ${fragment.id}</div>
        <div><strong>Type:</strong> ${fragment.type}</div>
        <div><strong>Size:</strong> ${fragment.size} bytes</div>
        <div><strong>Created:</strong> ${new Date(fragment.created).toLocaleString()}</div>
        <div><strong>Updated:</strong> ${new Date(fragment.updated).toLocaleString()}</div>
        
        <div class="fragment-actions" style="margin-top: 10px;">
          <button onclick="viewFragment('${fragment.id}', '${fragment.type}')">View</button>
          <button onclick="editFragmentHandler('${fragment.id}', '${fragment.type}')">Edit</button>
          <button class="delete-btn" onclick="deleteFragmentHandler('${fragment.id}')">Delete</button>
        </div>
        
        <div class="fragment-actions" style="margin-top: 5px;">
          <label>Convert to:</label>
          <select id="convert-${fragment.id}" onchange="convertFragmentHandler('${fragment.id}')">
            <option value="" disabled selected hidden>Select format</option>
            ${optionsHtml}
          </select>
        </div>

        <div id="content-${fragment.id}"></div>
      `;
      
      fragmentsContainer.appendChild(fragmentDiv);
    }
  } catch (err) {
    fragmentsContainer.innerHTML = '<p>Error loading items. Please try again.</p>';
    console.error('Error displaying items:', err);
  }
}

// making functions global
window.viewFragment = async function(fragmentId, type) {
  const contentDiv = document.querySelector(`#content-${fragmentId}`);
  
  try {
    if (type && type.startsWith('image/')) {
      const extension = type.split('/')[1];
      const imageUrl = await getFragmentConverted(currentUser, fragmentId, extension);
      
      const contentContainer = document.createElement('div');
      contentContainer.className = 'fragment-content';
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      contentContainer.appendChild(img);
      
      contentDiv.innerHTML = '';
      contentDiv.appendChild(contentContainer);
      return;
    }

    const content = await getFragment(currentUser, fragmentId);
    
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'fragment-content';
    
    if (type === 'text/html') {
        contentContainer.textContent = content;
    } else if (type === 'application/json') {
        try {
            contentContainer.textContent = JSON.stringify(JSON.parse(content), null, 2);
        } catch (e) {
            contentContainer.textContent = content;
        }
    } else {
        contentContainer.textContent = content || '[Empty content]';
    }
    
    // Clear and append
    contentDiv.innerHTML = '';
    contentDiv.appendChild(contentContainer);
    
  } catch (err) {
    contentDiv.innerHTML = '<p style="color: red;">Error loading item content</p>';
    console.error('Error viewing item:', err);
  }
};

window.deleteFragmentHandler = async function(fragmentId) {
  if (!confirm('Are you sure you want to delete this fragment?')) {
    return;
  }
  
  try {
    await deleteFragment(currentUser, fragmentId);
    // Refresh the list
    await displayFragments(currentUser);
  } catch (err) {
    alert('Error deleting fragment: ' + err.message);
  }
};

window.editFragmentHandler = async function(fragmentId, type) {
  const contentDiv = document.querySelector(`#content-${fragmentId}`);
  
  try {
    const content = await getFragment(currentUser, fragmentId);
    
    contentDiv.innerHTML = `
      <div style="margin-top: 10px;">
        <textarea id="edit-content-${fragmentId}" style="width: 100%; min-height: 150px; font-family: monospace;">${content}</textarea>
        <div style="margin-top: 5px;">
          <button onclick="saveFragmentHandler('${fragmentId}', '${type}')">Save Changes</button>
          <button onclick="viewFragment('${fragmentId}', '${type}')">Cancel</button>
        </div>
      </div>
    `;
  } catch (err) {
    alert('Error loading fragment for editing: ' + err.message);
  }
};

window.saveFragmentHandler = async function(fragmentId, type) {
  const newContent = document.querySelector(`#edit-content-${fragmentId}`).value;
  
  try {
    await updateFragment(currentUser, fragmentId, newContent, type);
    alert('Fragment updated successfully!');
    // Refresh the list to show updated metadata
    await displayFragments(currentUser);
    // Re-open the view
    await window.viewFragment(fragmentId, type);
  } catch (err) {
    alert('Error updating fragment: ' + err.message);
  }
};

window.convertFragmentHandler = async function(fragmentId) {
  const select = document.querySelector(`#convert-${fragmentId}`);
  const extension = select.value;
  if (!extension) return;
  
  const contentDiv = document.querySelector(`#content-${fragmentId}`);
  contentDiv.innerHTML = '<p>Converting...</p>';
  
  try {
    const content = await getFragmentConverted(currentUser, fragmentId, extension);
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'fragment-content';
    
    if (extension === 'png' || extension === 'jpg' || extension === 'webp' || extension === 'gif' || extension === 'avif') {
      const img = document.createElement('img');
      img.src = content;
      img.style.maxWidth = '100%';
      contentContainer.innerHTML = '';
      contentContainer.appendChild(img);
    } else if (extension === 'html') {
       contentContainer.innerHTML = content;
    } else if (typeof content === 'object') {
      contentContainer.textContent = JSON.stringify(content, null, 2);
    } else {
      contentContainer.textContent = content;
    }
    
    contentDiv.innerHTML = '';
    contentDiv.appendChild(contentContainer);
    
    select.value = '';
  } catch (err) {
    contentDiv.innerHTML = `<p style="color: red;">Error converting fragment: ${err.message}</p>`;
  }
};

window.toggleInputMethod = function() {
  const contentType = document.querySelector('#fragment-type').value;
  const textContainer = document.querySelector('#text-input-container');
  const fileContainer = document.querySelector('#file-input-container');
  
  if (contentType.startsWith('image/')) {
    textContainer.hidden = true;
    fileContainer.hidden = false;
    document.querySelector('#fragment-content').required = false;
    document.querySelector('#fragment-file').required = true;
    document.querySelector('#fragment-file').accept = contentType;
  } else {
    textContainer.hidden = false;
    fileContainer.hidden = true;
    document.querySelector('#fragment-content').required = true;
    document.querySelector('#fragment-file').required = false;
  }
};

window.resetToDefault = function() {
  document.querySelector('#fragment-type').value = 'text/plain';
  window.toggleInputMethod();
};

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const createForm = document.querySelector('#create-fragment-form');

  
  loginBtn.onclick = () => {
    // Sign in the user
    signIn();
  };

  logoutBtn.onclick = () => {
    // Sign out the user
    signOut();
  };

  // Handle item creation form
  createForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const contentType = document.querySelector('#fragment-type').value;
    const resultDiv = document.querySelector('#create-result');
    
    let content;
    
    if (contentType.startsWith('image/')) {
      // File upload
      const fileInput = document.querySelector('#fragment-file');
      if (fileInput.files.length === 0) {
        resultDiv.innerHTML = '<p style="color: red;">Please select a file</p>';
        return;
      }
      content = fileInput.files[0];
    } else {
      // Text input
      content = document.querySelector('#fragment-content').value;
      
      if (!content.trim()) {
        resultDiv.innerHTML = '<p style="color: red;">Please enter some content</p>';
        return;
      }

    
      if (contentType === 'application/json') {
        try {
          const parsed = JSON.parse(content);
          content = JSON.stringify(parsed);
        } catch (err) {
          resultDiv.innerHTML = '<p style="color: red;">Invalid JSON. Please fix the JSON and try again.</p>';
          return;
        }
      }
    }

    try {
      resultDiv.innerHTML = '<p>Creating item...</p>';
      
      const result = await createFragment(currentUser, content, contentType);
      
      // Show simple success message
      resultDiv.innerHTML = `
        <div style="color: white; padding: 10px; background: #6e7f72ff; border-radius: 4px;">
          <strong>Item Created Successfully!</strong><br>
          <strong>ID:</strong> ${result.fragment.id}<br>
          <strong>Size:</strong> ${result.fragment.size} bytes<br>
          <strong>Type:</strong> ${result.fragment.type}
        </div>
      `;
      
      // Clear the form
      document.querySelector('#fragment-content').value = '';
      document.querySelector('#fragment-file').value = '';
      
      // Display the items list
      await displayFragments(currentUser);
    } catch (err) {
      resultDiv.innerHTML = `
        <div style="color: red; padding: 10px; background: #f8d7da; border-radius: 4px;">
          <strong>Error creating item</strong><br>
          ${err.message || 'Please try again.'}
        </div>
      `;
      console.error('Error creating item:', err);
    }
  };

  // Handle clear form button
  document.querySelector('#clear-form').onclick = () => {
    document.querySelector('#fragment-content').value = '';
    document.querySelector('#fragment-file').value = '';
    document.querySelector('#create-result').innerHTML = '';
  };

  // See if we're signed in 
  const user = await getUser();
  if (!user) {
    return;
  }

  // Store user globally for use in other functions
  currentUser = user;

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Hide the Login button and show Logout button
  loginBtn.hidden = true;
  logoutBtn.hidden = false;

  // Load and display user fragments
  await displayFragments(user);
}

// Wait for the DOM to be ready
addEventListener('DOMContentLoaded', init);