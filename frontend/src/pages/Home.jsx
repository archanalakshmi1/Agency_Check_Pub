import React, { useState } from 'react';
import './Home.css';

const ClientForm = () => {
  const [agentName, setAgentName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [resultData, setResultData] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setResultData(null);
    setShowResult(false);
    try {
      const response = await fetch('http://localhost:5000/eligibility-check', {
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }) 
      });
    
    const data = await response.json();
    setResultData(data);
    setShowResult(true);

    const result = data.status;
    const reason = data.reason;

    await fetch('http://localhost:5001/submit-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agency_name: agentName,
        agency_website: website,
        agency_email: email,
        agency_contact: contactName,
        verification_result: result,
        remarks: reason
      })
    });
    } 
    catch (error) {
      console.error('Error:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('http://localhost:5001/export-csv');
      if (!response.ok) throw new Error('CSV export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const disposition = response.headers.get('Content-Disposition');
      let filename = 'agency_approval_history.csv'; 

    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?(.+?)"?$/);
      if (match && match[1]) {
        filename = match[1];
      }
    }


      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('CSV Export Error:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch('http://localhost:5000/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName,
          email: email,
          status: resultData.status
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
  
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Email send error:', error);
      alert('Failed to send email.');
    }
  };

  return (
    <div className="client-form-container">
      <div className="client-form-box">
        <h3>Agency Details</h3>
        <form onSubmit={handleSubmit}>
        <div className="position-label">
          <span className="input-label">Agency Name:</span>
          <input
            type="name"
            placeholder="Agency Name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            required
            onInput={(e) => e.target.setCustomValidity('')}
          />
          </div>
          <div className="position-label">
          <span className="input-label">Agency Website:</span>
          <input
            type="url"
            placeholder="Agency Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            required
            onInvalid={(e) => e.target.setCustomValidity('Invalid website URL')}
            onInput={(e) => e.target.setCustomValidity('')}
          />
          </div>
          <div className="position-label">
          <span className="input-label">Contact Name:</span>
          <input
            type="name"
            placeholder="Agency Contact Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
        
            onInput={(e) => e.target.setCustomValidity('')}
          />
          </div>
          <div className="position-label">
          <span className="input-label">Contact Email:</span>
          <input
            type="email"
            placeholder="Agency Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            onInvalid={(e) => e.target.setCustomValidity('Invalid email')}
            onInput={(e) => e.target.setCustomValidity('')}
          />
          </div>
          <button type="submit">Check Eligibility</button>
        </form>
      </div>
      <button className='csv-button' onClick={handleExportCSV}>Extract Approval History to CSV</button>


      {showResult && resultData && (
        <div className="client-form-box-result" style={{ marginTop: '20px' }}>
          <h3>Eligibility Result</h3><br></br>
          <h4>Status</h4>
          <textarea className="textarea-status" value={resultData.status} readOnly />

          <h4>Reason</h4>
          <textarea value={resultData.reason} readOnly />

          {resultData.status === 'ERROR' && (
          <div>
            <h4>Additional Info</h4>
            <textarea value={resultData.additional_info} readOnly />
          </div>
          )}

          <button onClick={handleSendEmail}>Send Email to Agent</button>
        </div>
      )}
    </div>
  );
};

export default ClientForm;
