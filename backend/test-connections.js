import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

// Generate unique email addresses
const timestamp = Date.now();
const testUser1 = {
  email: `test1-${timestamp}@example.com`,
  password: 'Password123!',
  name: 'Test User 1'
};

const testUser2 = {
  email: `test2-${timestamp}@example.com`,
  password: 'Password123!',
  name: 'Test User 2'
};

let accessToken1 = null;
let accessToken2 = null;
let testUserId1 = null;
let testUserId2 = null;

async function registerAndLoginUser(userData) {
  try {
    // Try to login first
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      })
    });

    const loginData = await loginResponse.json();
    console.log(`Login ${userData.name} response:`, loginData);

    // If login is successful, return the tokens
    if (loginData.success) {
      return {
        accessToken: loginData.data.tokens.accessToken,
        userId: loginData.data.user.id
      };
    }

    // If login failed, try to register the user
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name
      })
    });

    const registerData = await registerResponse.json();
    console.log(`Register ${userData.name} response:`, registerData);

    if (!registerData.success) {
      console.error(`Registration failed for ${userData.name}:`, registerData.message);
      return null;
    }

    // Login user after registration
    const loginResponse2 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      })
    });

    const loginData2 = await loginResponse2.json();
    console.log(`Login ${userData.name} response:`, loginData2);

    if (!loginData2.success) {
      console.error(`Login failed for ${userData.name}:`, loginData2.message);
      return null;
    }

    // Complete onboarding (nickname will be generated automatically)
        const onboardingResponse = await fetch(`${API_BASE}/profile/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData2.data.tokens.accessToken}`
          },
          body: JSON.stringify({
            avatarUrl: null
          })
        });

    const onboardingData = await onboardingResponse.json();
    console.log(`Onboarding ${userData.name} response:`, onboardingData);

    if (!onboardingData.success) {
      console.error(`Onboarding failed for ${userData.name}:`, onboardingData.message);
      return null;
    }

    return {
      accessToken: loginData2.data.tokens.accessToken,
      userId: loginData2.data.user.id
    };
  } catch (error) {
    console.error(`Error in registerAndLoginUser for ${userData.name}:`, error);
    return null;
  }
}

async function testConnectionsAPI() {
  console.log('Testing Connections API...\n');

  // Register and login two test users
  console.log('1. Registering and logging in test users...');
  const user1Data = await registerAndLoginUser(testUser1);
  if (!user1Data) {
    console.error('Failed to register/login user 1');
    return;
  }

  accessToken1 = user1Data.accessToken;
  testUserId1 = user1Data.userId;

  const user2Data = await registerAndLoginUser(testUser2);
  if (!user2Data) {
    console.error('Failed to register/login user 2');
    return;
  }

  accessToken2 = user2Data.accessToken;
  testUserId2 = user2Data.userId;

  // Test search users
    console.log('\n2. Testing search users...');
    try {
      // Search for users containing "test"
      const searchResponse = await fetch(`${API_BASE}/connections/search?query=test`, {
        headers: {
          'Authorization': `Bearer ${accessToken1}`
        }
      });
  
      const searchData = await searchResponse.json();
      console.log('Search response:', searchData);
      
      // Also search from the second user's perspective
      const searchResponse2 = await fetch(`${API_BASE}/connections/search?query=test`, {
        headers: {
          'Authorization': `Bearer ${accessToken2}`
        }
      });
  
      const searchData2 = await searchResponse2.json();
      console.log('Search response (user 2 perspective):', searchData2);
    } catch (error) {
      console.error('Error searching users:', error);
    }

  // Test send connection request
  console.log('\n3. Testing send connection request...');
  try {
    const sendRequestResponse = await fetch(`${API_BASE}/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken1}`
      },
      body: JSON.stringify({
        receiverId: testUserId2
      })
    });

    const sendRequestData = await sendRequestResponse.json();
    console.log('Send request response:', sendRequestData);
  } catch (error) {
    console.error('Error sending connection request:', error);
  }

  // Test get connection requests
  console.log('\n4. Testing get connection requests...');
  try {
    const requestsResponse = await fetch(`${API_BASE}/connections/requests`, {
      headers: {
        'Authorization': `Bearer ${accessToken2}`
      }
    });

    const requestsData = await requestsResponse.json();
    console.log('Requests response:', requestsData);
  } catch (error) {
    console.error('Error getting connection requests:', error);
  }

  console.log('\nTest completed.');
}

// Run the test
testConnectionsAPI();