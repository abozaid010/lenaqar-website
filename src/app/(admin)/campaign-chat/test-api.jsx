"use client";

import { useState } from "react";
import { fetchCampaignSessions, fetchCampaignSession } from "@/utils/api";

const TestAPI = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testSessionsAPI = async () => {
    setLoading(true);
    try {
      const data = await fetchCampaignSessions({
        client_id: "public",
        page: 1,
        page_size: 5
      });
      setResult({ type: 'sessions', data });
    } catch (error) {
      setResult({ type: 'error', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSessionAPI = async () => {
    setLoading(true);
    try {
      const data = await fetchCampaignSession({
        client_id: "public",
        phone_number: "201001234567"
      });
      setResult({ type: 'session', data });
    } catch (error) {
      setResult({ type: 'error', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Campaign Chat API Test</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testSessionsAPI}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Sessions API"}
        </button>
        
        <button
          onClick={testSessionAPI}
          disabled={loading}
          className="ml-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Session API"}
        </button>
      </div>

      {result && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto bg-white p-3 rounded border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestAPI;
