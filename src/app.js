// src/app.js

import { signIn, getUser, signOut } from './auth';
import { getUserFragments, createFragment, getFragment, deleteFragment, apiUrl } from './api';

// Global user variable to be used in event handlers
let currentUser = null;

async function displayFragments(user) {
  const fragmentsContainer = document.querySelector('#fragments-container');
  
  try {
    const userFragments = await getUserFragments(user);
    
    if (!userFragments || !userFragments.fragments || userFragments.fragments.length === 0) {
      fragmentsContainer.innerHTML = '<p>No fragments yet. Create your first one above!</p>';
      return;
    }

    // Clear the container
    fragmentsContainer.innerHTML = '';

    // Display each fragment
    for (const fragment of userFragments.fragments) {
      const fragmentDiv = document.createElement('div');
      fragmentDiv.className = 'fragment-item';
      
      fragmentDiv.innerHTML = `
        <div><strong>ID:</strong> <code>${fragment.id}</code></div>
        <div><strong>Type:</strong> ${fragment.type}</div>
        <div><strong>Size:</strong> ${fragment.size} bytes</div>
        <div><strong>Created:</strong> ${new Date(fragment.created).toLocaleString()}</div>
        <div><strong>Updated:</strong> ${new Date(fragment.updated).toLocaleString()}</div>
        <div class="fragment-actions">
          <button onclick="viewFragment('${fragment.id}')">View Content</button>
        </div>
        <div id="content-${fragment.id}"></div>
      `;
      
      fragmentsContainer.appendChild(fragmentDiv);
    }
  } catch (err) {
    fragmentsContainer.innerHTML = '<p>Error loading fragments. Please try again.</p>';
    console.error('Error displaying fragments:', err);
  }
}

// Make functions global so they can be called from HTML onclick
window.viewFragment = async function(fragmentId) {
  const contentDiv = document.querySelector(`#content-${fragmentId}`);
  console.log('Content div found:', contentDiv);
  
  try {
    const content = await getFragment(currentUser, fragmentId);
    console.log('Fragment content retrieved:', content);
    console.log('Content length:', content.length);
    
    // Create a visible container with explicit styling
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      background: #f8f9fa; 
      padding: 15px; 
      margin: 10px 0; 
      border: 1px solid #ddd; 
      border-radius: 4px; 
      white-space: pre-wrap; 
      font-family: monospace;
      min-height: 40px;
      color: #333;
    `;
    
    // Set the text content
    contentContainer.textContent = content || '[Empty content]';
    
    // Clear and append
    contentDiv.innerHTML = '';
    contentDiv.appendChild(contentContainer);
    
    console.log('Content displayed successfully');
  } catch (err) {
    contentDiv.innerHTML = '<p style="color: red;">Error loading fragment content</p>';
    console.error('Error viewing fragment:', err);
  }
};

// Delete functionality removed - not required for Assignment 1

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const createForm = document.querySelector('#create-fragment-form');
  const refreshBtn = document.querySelector('#refresh-fragments');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    signIn();
  };

  logoutBtn.onclick = () => {
    // Sign out the user
    signOut();
  };

  // Handle fragment creation form
  createForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const contentType = document.querySelector('#fragment-type').value;
    const content = document.querySelector('#fragment-content').value;
    const resultDiv = document.querySelector('#create-result');
    
    if (!content.trim()) {
      resultDiv.innerHTML = '<p style="color: red;">Please enter some content</p>';
      return;
    }

    try {
      resultDiv.innerHTML = '<p>Creating fragment...</p>';
      
      const result = await createFragment(currentUser, content, contentType);
      
      // Show simple success message
      resultDiv.innerHTML = `
        <div style="color: green; padding: 10px; background: #d4edda; border-radius: 4px;">
          <strong>✅ Fragment Created Successfully!</strong><br>
          <strong>ID:</strong> <code>${result.fragment.id}</code><br>
          <strong>Size:</strong> ${result.fragment.size} bytes<br>
          <strong>Type:</strong> ${result.fragment.type}
        </div>
      `;
      
      // Clear the form
      document.querySelector('#fragment-content').value = '';
      
      // Refresh the fragments list
      await displayFragments(currentUser);
    } catch (err) {
      resultDiv.innerHTML = `
        <div style="color: red; padding: 10px; background: #f8d7da; border-radius: 4px;">
          <strong>❌ Error creating fragment</strong><br>
          ${err.message || 'Please try again.'}
        </div>
      `;
      console.error('Error creating fragment:', err);
    }
  };

  // Handle clear form button
  document.querySelector('#clear-form').onclick = () => {
    document.querySelector('#fragment-content').value = '';
    document.querySelector('#create-result').innerHTML = '';
  };

  // Handle refresh button
  refreshBtn.onclick = () => {
    displayFragments(currentUser);
  };

  // See if we're signed in (i.e., we'll have a `user` object)
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

  // Disable the Login button
  loginBtn.disabled = true;
  logoutBtn.hidden = false;

  // Load and display user fragments
  await displayFragments(user);
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);