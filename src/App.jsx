import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Table as TableIcon, 
  MapPin, 
  Tag, 
  Globe, 
  Sparkles,
  Building2,
  Users,
  Target,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const [webhookUrl, setWebhookUrl] = useState('https://nunofyobiness.app.n8n.cloud/webhook/leadscope');
  const [formData, setFormData] = useState({
    industry: '',
    geography: '',
    companySize: '',
    leadCount: 5,
    requirement: '',
    exclusions: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [leads, setLeads] = useState([]);
  const [queryMeta, setQueryMeta] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!webhookUrl.trim()) {
      setStatus({ type: 'error', msg: '⚠️ Please provide an n8n Webhook URL above.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'searching', msg: '🔍 Agent is searching Google & Tavily, evaluating metrics, and verifying sources...' });
    setLeads([]);

    try {
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);

      const data = await res.json();
      let extracted = [];

      if (data.leads) {
        extracted = data.leads;
      } else if (Array.isArray(data)) {
        extracted = data;
      } else if (data.success && data.leads) {
        extracted = data.leads;
      } else {
        const raw = data.output || data.text || JSON.stringify(data);
        try {
          const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const start = clean.indexOf('[');
          const end = clean.lastIndexOf(']');
          if (start !== -1 && end !== -1) {
            extracted = JSON.parse(clean.substring(start, end + 1));
          }
        } catch {
          extracted = [{ Company: 'Company Record', Fit_Reason: raw, Fit_Status: 'Unclear', Confidence: 'Medium' }];
        }
      }

      setLeads(extracted);
      setQueryMeta({
        industry: formData.industry,
        geography: formData.geography,
        timestamp: new Date().toLocaleTimeString()
      });
      setStatus({ type: 'success', msg: `✅ Successfully discovered and qualified ${extracted.length} candidate companies.` });
    } catch (err) {
      setStatus({ type: 'error', msg: `❌ Error: ${err.message}. Ensure your n8n workflow is published & active.` });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!leads.length) return;
    const headers = ['Company', 'Website', 'Location', 'Industry', 'Fit_Status', 'Fit_Reason', 'Evidence', 'Source_URL', 'Confidence'];
    const csv = [
      headers.join(','),
      ...leads.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'LeadScope_Qualified_Leads.csv';
    a.click();
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(leads, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats calculation
  const qualifiedCount = leads.filter(l => (l.Fit_Status || '').toLowerCase().includes('qualified') && !(l.Fit_Status || '').toLowerCase().includes('not')).length;
  const unclearCount = leads.filter(l => (l.Fit_Status || '').toLowerCase().includes('unclear')).length;
  const highConfCount = leads.filter(l => (l.Confidence || '').toLowerCase() === 'high').length;

  return (
    <>
      <div className="bg-gradient"></div>
      <div className="container">
        
        {/* Header */}
        <header className="header">
          <div className="logo-badge">
            <Compass />
            AI Lead Intelligence
          </div>
          <h1>LeadScope</h1>
          <p>Targeted company discovery powered by Gemini reasoning and live Tavily web research.</p>
        </header>

        {/* Form Card */}
        <div className="form-card">
          <h2>Define Search Brief</h2>
          <p className="subtitle">Submit criteria to initiate automated web discovery and qualification.</p>

          <div className="config-bar">
            <label>🔗 Webhook URL:</label>
            <input 
              type="text" 
              value={webhookUrl} 
              onChange={(e) => setWebhookUrl(e.target.value)} 
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label><Building2 size={15} /> Target Industry / Sector <span className="req">*</span></label>
                <input 
                  type="text" 
                  name="industry" 
                  required 
                  placeholder="e.g. Recycling companies, B2B SaaS, HealthTech"
                  value={formData.industry}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label><MapPin size={15} /> Geography / Country <span className="req">*</span></label>
                <input 
                  type="text" 
                  name="geography" 
                  required 
                  placeholder="e.g. India, United States, Europe"
                  value={formData.geography}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label><Users size={15} /> Company Size / Stage</label>
                <input 
                  type="text" 
                  name="companySize" 
                  placeholder="e.g. Early stage, 50-500 employees, Series A"
                  value={formData.companySize}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label><Target size={15} /> Number of Leads <span className="req">*</span></label>
                <select 
                  name="leadCount" 
                  value={formData.leadCount}
                  onChange={handleInputChange}
                  required
                >
                  <option value={3}>3 companies</option>
                  <option value={5}>5 companies</option>
                </select>
              </div>
            </div>

            <div className="form-grid full">
              <div className="field">
                <label><Sparkles size={15} /> Specific Requirement / Focus Area <span className="req">*</span></label>
                <textarea 
                  name="requirement" 
                  required 
                  placeholder="e.g. Circular economy solutions, plastic waste recycling, marketing tech"
                  value={formData.requirement}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>

            <div className="form-grid full">
              <div className="field">
                <label><ShieldAlert size={15} /> Strict Exclusions</label>
                <input 
                  type="text" 
                  name="exclusions" 
                  placeholder="e.g. Exclude NGOs, government bodies, consumer retail"
                  value={formData.exclusions}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Searching live web & qualifying...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Discover & Qualify Leads
                </>
              )}
            </button>
          </form>

          {status.msg && (
            <div className={`status-msg ${status.type}`}>
              {status.msg}
            </div>
          )}
        </div>

        {/* Results Section */}
        {leads.length > 0 && (
          <section className="results-section visible">
            
            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat-card">
                <div className="stat-val">{leads.length}</div>
                <div className="stat-label">Total Leads</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{ color: 'var(--emerald)' }}>{qualifiedCount}</div>
                <div className="stat-label">Qualified</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{ color: 'var(--amber)' }}>{unclearCount}</div>
                <div className="stat-label">Unclear / Low Evidence</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{ color: '#c4b5fd' }}>{highConfCount}</div>
                <div className="stat-label">High Confidence</div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="results-header">
              <div className="results-title">
                <h2>🎯 Qualified Candidates</h2>
                <p>Target: {queryMeta?.industry} in {queryMeta?.geography} • {queryMeta?.timestamp}</p>
              </div>
              <div className="controls-group">
                <div className="view-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    <Layers size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Cards
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Table
                  </button>
                </div>
                <button className="act-btn" onClick={exportCSV}>
                  <Download size={14} /> Export CSV
                </button>
                <button className="act-btn" onClick={copyJSON}>
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} 
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>

            {/* Cards View */}
            {viewMode === 'cards' ? (
              <div className="cards-feed">
                {leads.map((lead, i) => {
                  const statusStr = (lead.Fit_Status || '').toLowerCase();
                  const isQualified = statusStr.includes('qualified') && !statusStr.includes('not');
                  const isUnclear = statusStr.includes('unclear');
                  const statusBadgeClass = isQualified ? 'badge-qualified' : (isUnclear ? 'badge-unclear' : 'badge-not');

                  let rawSource = lead.Source_URL || lead.source_url || lead.source_urls || '';
                  if (Array.isArray(rawSource)) rawSource = rawSource[0] || '';
                  let domainDisplay = 'Source Link';
                  if (rawSource && rawSource !== 'N/A') {
                    try { domainDisplay = new URL(rawSource).hostname.replace(/^www\./, ''); } catch { domainDisplay = 'View Source'; }
                  }

                  const website = lead.Website || lead.website || '';
                  const cleanWeb = website && website !== 'N/A' ? (website.startsWith('http') ? website : `https://${website}`) : null;

                  return (
                    <div className="lead-card" key={i}>
                      <div className="card-top">
                        <div className="card-company">
                          <span className="company-index">#{i + 1}</span>
                          <h3>{lead.Company || 'Unknown Company'}</h3>
                          {cleanWeb && (
                            <a href={cleanWeb} target="_blank" rel="noopener noreferrer" className="meta-pill" style={{ color: '#c4b5fd', textDecoration: 'none' }}>
                              <Globe size={12} /> {website.replace(/https?:\/\/(www\.)?/, '')} <ExternalLink size={10} />
                            </a>
                          )}
                          <span className="meta-pill"><MapPin size={12} /> {lead.Location || 'Unknown'}</span>
                          <span className="meta-pill"><Tag size={12} /> {lead.Industry || 'Industry'}</span>
                        </div>
                        <div className="badges-group">
                          <span className={`badge ${statusBadgeClass}`}>{lead.Fit_Status || 'Qualified'}</span>
                          {lead.Confidence && <span className="badge badge-conf">🎯 {lead.Confidence} Conf</span>}
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="info-block">
                          <div className="info-block-title">💡 Qualification Rationale</div>
                          <div className="info-block-content">{lead.Fit_Reason || 'No justification provided.'}</div>
                        </div>
                        <div className="info-block">
                          <div className="info-block-title">🔍 Verified Evidence</div>
                          <div className="info-block-content">{lead.Evidence || 'Public evidence checked via web search.'}</div>
                        </div>
                      </div>

                      <div className="card-footer">
                        <span>Verified Company Record</span>
                        {rawSource && rawSource !== 'N/A' ? (
                          <a href={rawSource} target="_blank" rel="noopener noreferrer" className="source-pill">
                            🔗 {domainDisplay} <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span>No direct source URL</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="table-view-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Industry</th>
                      <th>Fit Status</th>
                      <th>Confidence</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => {
                      const statusStr = (lead.Fit_Status || '').toLowerCase();
                      const isQualified = statusStr.includes('qualified') && !statusStr.includes('not');
                      const isUnclear = statusStr.includes('unclear');
                      const statusBadgeClass = isQualified ? 'badge-qualified' : (isUnclear ? 'badge-unclear' : 'badge-not');

                      let rawSource = lead.Source_URL || lead.source_url || lead.source_urls || '';
                      if (Array.isArray(rawSource)) rawSource = rawSource[0] || '';
                      let domainDisplay = 'Source Link';
                      if (rawSource && rawSource !== 'N/A') {
                        try { domainDisplay = new URL(rawSource).hostname.replace(/^www\./, ''); } catch { domainDisplay = 'View Source'; }
                      }

                      return (
                        <tr key={i}>
                          <td><strong>{i + 1}</strong></td>
                          <td><strong>{lead.Company || 'N/A'}</strong></td>
                          <td>{lead.Location || 'N/A'}</td>
                          <td>{lead.Industry || 'N/A'}</td>
                          <td><span className={`badge ${statusBadgeClass}`}>{lead.Fit_Status || 'Unclear'}</span></td>
                          <td>{lead.Confidence || 'Medium'}</td>
                          <td>
                            {rawSource && rawSource !== 'N/A' ? (
                              <a href={rawSource} target="_blank" rel="noopener noreferrer" className="source-pill" style={{ fontSize: 11 }}>
                                {domainDisplay}
                              </a>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
