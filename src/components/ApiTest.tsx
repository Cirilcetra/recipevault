import React, { useEffect, useState } from 'react';

interface ApiResponse {
  message?: string;
  status?: string;
}

const ApiTest: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div>
      <h2>API Test</h2>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ApiTest; 