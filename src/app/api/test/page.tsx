import { getAccessToken } from '@/lib/auth-actions';
import { useQuery } from '@tanstack/react-query';

export default async function DashboardPage() {
  const token = await getAccessToken();

  try {
    const response = await fetch('http://localhost:8080/product/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    // Get the raw text first to see what we're actually receiving
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Check if the response is ok (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return (
        <>
          <h2>You made it</h2>
          <div>
            <h3>Error: Response is not valid JSON</h3>
            <p>Raw response: {responseText}</p>
          </div>
        </>
      );
    }

    return (
      <>
        <h2>You made it</h2>
        <div>{JSON.stringify(jsonData)}</div>
      </>
    );
  } catch (error) {
    console.error('Fetch error:', error);
    return (
      <>
        <h2>You made it</h2>
        <div>
          <h3>Error occurred:</h3>
          <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </>
    );
  }
}
