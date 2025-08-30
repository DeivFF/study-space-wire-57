// Simple script to test if the profile endpoint is working

const testProfile = async () => {
  try {
    console.log('Testing profile endpoint...');
    
    // Test with a valid UUID format (but non-existent user)
    const response = await fetch('http://localhost:3002/api/profile/00000000-0000-0000-0000-000000', {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail authentication, but we're testing the endpoint
      }
    });
    
    console.log('Profile endpoint status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Profile endpoint data:', data);
    } else {
      const errorText = await response.text();
      console.log('Profile endpoint error:', errorText);
    }
    
    console.log('Profile test completed.');
  } catch (error) {
    console.error('Profile test failed:', error.message);
  }
};

testProfile();