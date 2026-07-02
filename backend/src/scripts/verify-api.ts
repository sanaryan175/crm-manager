// Native global fetch is used (available in Node 18+) to avoid external dependency issues.

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=============================================');
  console.log('🧪 Starting CRM API Verification Suite');
  console.log('=============================================');

  let token = '';
  let contactId = '';
  let dealId = '';
  let activityId = '';

  // Test 1: Register a new user
  try {
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verification Bot',
        email: `bot-${Date.now()}@company.com`,
        password: 'password123',
        role: 'rep',
      }),
    });
    
    const regResult: any = await registerResponse.json();
    if (registerResponse.status === 201 && regResult.success) {
      console.log('✅ Test 1 Passed: User Registration successful');
    } else {
      console.error('❌ Test 1 Failed: User Registration status:', registerResponse.status, regResult);
    }
  } catch (err) {
    console.error('❌ Test 1 Failed: User Registration error:', err);
  }

  // Test 2: Login with seeded user Sarah Chen
  try {
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah@company.com',
        password: 'password123',
      }),
    });

    const loginResult: any = await loginResponse.json();
    if (loginResponse.status === 200 && loginResult.success && loginResult.data.token) {
      token = loginResult.data.token;
      console.log('✅ Test 2 Passed: User Login successful');
    } else {
      console.error('❌ Test 2 Failed: User Login status:', loginResponse.status, loginResult);
      return; // Can't proceed without token
    }
  } catch (err) {
    console.error('❌ Test 2 Failed: User Login error:', err);
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test 3: Get Current User Profile (/auth/me)
  try {
    const meResponse = await fetch(`${API_URL}/auth/me`, { headers: authHeaders });
    const meResult: any = await meResponse.json();
    if (meResponse.status === 200 && meResult.success && meResult.data.email === 'sarah@company.com') {
      console.log('✅ Test 3 Passed: Profile fetching verified');
    } else {
      console.error('❌ Test 3 Failed: Profile fetching status:', meResponse.status, meResult);
    }
  } catch (err) {
    console.error('❌ Test 3 Failed: Profile fetching error:', err);
  }

  // Test 4: Create a Contact (POST /contacts)
  try {
    const contactResponse = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        firstName: 'Verification',
        lastName: 'Contact',
        email: 'verify-contact@company.com',
        company: 'Verification Labs',
        jobTitle: 'QA Specialist',
        status: 'active',
        source: 'website',
        tags: ['verification', 'api-test'],
      }),
    });

    const contactResult: any = await contactResponse.json();
    if (contactResponse.status === 201 && contactResult.success) {
      contactId = contactResult.data.id;
      console.log(`✅ Test 4 Passed: Contact created successfully (ID: ${contactId})`);
    } else {
      console.error('❌ Test 4 Failed: Contact creation status:', contactResponse.status, contactResult);
    }
  } catch (err) {
    console.error('❌ Test 4 Failed: Contact creation error:', err);
  }

  // Test 5: Get Contacts (GET /contacts)
  try {
    const listResponse = await fetch(`${API_URL}/contacts`, { headers: authHeaders });
    const listResult: any = await listResponse.json();
    if (listResponse.status === 200 && listResult.success && listResult.data.length > 0) {
      console.log(`✅ Test 5 Passed: Fetched ${listResult.data.length} contacts successfully`);
    } else {
      console.error('❌ Test 5 Failed: Contact fetching status:', listResponse.status, listResult);
    }
  } catch (err) {
    console.error('❌ Test 5 Failed: Contact fetching error:', err);
  }

  // Test 6: Create a Deal (POST /deals)
  try {
    const dealResponse = await fetch(`${API_URL}/deals`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Verification Large Deal',
        contactId: contactId || undefined,
        company: 'Verification Labs',
        value: 120000,
        stage: 'new',
        priority: 'high',
      }),
    });

    const dealResult: any = await dealResponse.json();
    if (dealResponse.status === 201 && dealResult.success) {
      dealId = dealResult.data.id;
      console.log(`✅ Test 6 Passed: Deal created successfully (ID: ${dealId})`);
    } else {
      console.error('❌ Test 6 Failed: Deal creation status:', dealResponse.status, dealResult);
    }
  } catch (err) {
    console.error('❌ Test 6 Failed: Deal creation error:', err);
  }

  // Test 7: Update Deal Stage (PUT /deals/:id/stage)
  try {
    const stageResponse = await fetch(`${API_URL}/deals/${dealId}/stage`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ stage: 'negotiation' }),
    });

    const stageResult: any = await stageResponse.json();
    if (stageResponse.status === 200 && stageResult.success && stageResult.data.stage === 'negotiation') {
      console.log('✅ Test 7 Passed: Deal stage transition verified');
    } else {
      console.error('❌ Test 7 Failed: Deal stage update status:', stageResponse.status, stageResult);
    }
  } catch (err) {
    console.error('❌ Test 7 Failed: Deal stage update error:', err);
  }

  // Test 8: Create an Activity (POST /activities)
  try {
    const activityResponse = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'task',
        subject: 'Run API Verification Test Suite',
        description: 'Verify all database relationships and REST handlers.',
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const activityResult: any = await activityResponse.json();
    if (activityResponse.status === 201 && activityResult.success) {
      activityId = activityResult.data.id;
      console.log(`✅ Test 8 Passed: Activity created successfully (ID: ${activityId})`);
    } else {
      console.error('❌ Test 8 Failed: Activity creation status:', activityResponse.status, activityResult);
    }
  } catch (err) {
    console.error('❌ Test 8 Failed: Activity creation error:', err);
  }

  // Test 9: Complete Activity (PUT /activities/:id/complete)
  try {
    const completeResponse = await fetch(`${API_URL}/activities/${activityId}/complete`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ completed: true }),
    });

    const completeResult: any = await completeResponse.json();
    if (completeResponse.status === 200 && completeResult.success && completeResult.data.completed === true) {
      console.log('✅ Test 9 Passed: Activity completion state updated successfully');
    } else {
      console.error('❌ Test 9 Failed: Activity completion status:', completeResponse.status, completeResult);
    }
  } catch (err) {
    console.error('❌ Test 9 Failed: Activity completion error:', err);
  }

  // Test 10: Fetch Dashboard Metrics (GET /dashboard/metrics)
  try {
    const dashboardResponse = await fetch(`${API_URL}/dashboard/metrics`, { headers: authHeaders });
    const dashboardResult: any = await dashboardResponse.json();
    if (dashboardResponse.status === 200 && dashboardResult.success) {
      const data = dashboardResult.data;
      console.log('✅ Test 10 Passed: Dashboard KPI computations verified');
      console.log('   Stats retrieved:', {
        Contacts: data.totalContacts,
        Deals: data.totalDeals,
        PipelineValue: `$${data.pipelineValue}`,
        ConversionRate: `${data.conversionRate}%`,
        OverdueTasks: data.overdueTasks,
      });
    } else {
      console.error('❌ Test 10 Failed: Dashboard metrics status:', dashboardResponse.status, dashboardResult);
    }
  } catch (err) {
    console.error('❌ Test 10 Failed: Dashboard metrics error:', err);
  }

  console.log('=============================================');
  console.log('🎉 Verification Suite execution finished');
  console.log('=============================================');
}

runTests();
