// src/api.js

// fragments microservice API to use, defaults to EC2 instance if not set in env
// Handle cases where process.env might not be available in browser
let apiUrl;
try {
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://ec2-98-84-124-81.compute-1.amazonaws.com:8080';
} catch (e) {
  apiUrl = 'http://ec2-98-84-124-81.compute-1.amazonaws.com:8080'; 
}

// Export apiUrl for use in other modules
export { apiUrl };

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user) {
  console.log('Requesting user fragments data...');
  try {
    const fragmentsUrl = new URL('/v1/fragments', apiUrl);
    // get the full fragments object.
    fragmentsUrl.searchParams.set('expand', '1');
    const res = await fetch(fragmentsUrl, {
      
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

/**
 * Create a new fragment for an authenticated user
 */
export async function createFragment(user, content, contentType) {
  console.log('Creating new fragment...', { contentType, size: content.length });
  try {
    const fragmentsUrl = new URL('/v1/fragments', apiUrl);
    console.log('POST request to:', fragmentsUrl.toString());
    
    const res = await fetch(fragmentsUrl, {
      method: 'POST',
      headers: {
        ...user.authorizationHeaders(),
        'Content-Type': contentType,
      },
      body: content,
    });
    
    console.log('Response status:', res.status, res.statusText);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    console.log('Location header:', res.headers.get('location'));


    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response body:', errorText);
      throw new Error(`${res.status} ${res.statusText}: ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Successfully created fragment', { data });
    
    // Location header
    const locationHeader = res.headers.get('Location');
    if (locationHeader) {
      console.log('Location header:', locationHeader);
    }
    
    return data;
  } catch (err) {
    console.error('Unable to create fragment', { err });
    throw err;
  }
}

/**
 * Get detailed fragment data for a specific fragment ID
 */
export async function getFragment(user, fragmentId) {
  console.log('Getting fragment data...');
  try {
    const fragmentUrl = new URL(`/v1/fragments/${fragmentId}`, apiUrl);
    const res = await fetch(fragmentUrl, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.text();
    console.log('Successfully got fragment data', { data });
    return data;
  } catch (err) {
    console.error('Unable to get fragment', { err });
    throw err;
  }
}

