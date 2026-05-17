import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Award, FileText, CheckCircle, XCircle, Download, Printer, Search, Calendar, User, ShieldCheck } from 'lucide-react';

const Results = () => {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ usn: '', name: '' });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attempts/my-results`, { headers });
        // The API returns { attempts: [], usn: "", name: "" }
        setResults(res.data.attempts || []);
        setStudentInfo({ 
            usn: res.data.usn || user.usn || 'NOT ISSUED', 
            name: res.data.name || user.name 
        });
      } catch (err) {
        console.error('Failed to fetch results', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Verifying Academic Records...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Verification Header */}
        <div className="flex justify-between items-center mb-10 no-print">
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Award size={36} color="var(--primary)" /> Academic Transcript
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Official Institutional Grade Records & Results Repository</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Printer size={18} /> Print Transcript
            </button>
          </div>
        </div>

        {/* Student Identity Card */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem', borderLeft: '6px solid var(--primary)', background: 'var(--surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Candidate Name</label>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0.25rem 0 0 0' }}>{studentInfo.name}</p>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>University Seat Number (USN)</label>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0.25rem 0 0 0', color: 'var(--primary)' }}>{studentInfo.usn}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                 <ShieldCheck size={18} /> Verified Record
               </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--background)' }}>
              <tr>
                <th style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Course / Exam Title</th>
                <th style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Submission Date</th>
                <th style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Maximum</th>
                <th style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Achieved</th>
                <th style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No verified exam results published for this candidate yet.
                  </td>
                </tr>
              ) : (
                results.map(result => {
                  const isPublished = result.examId?.resultsPublished;
                  if (!isPublished) return null; // Only show published results
                  
                  return (
                    <React.Fragment key={result._id}>
                      <tr style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '1.25rem' }}>
                           <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{result.examId?.title}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Institutional Assessment</div>
                        </td>
                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600' }}>
                          {result.examId?.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 0}
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>
                          {result.score || 0}
                        </td>

                        <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                          <span style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                             PUBLISHED
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                           <button 
                             onClick={() => setExpandedId(expandedId === result._id ? null : result._id)}
                             className="btn" 
                             style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', border: '1px solid var(--border)', background: 'var(--surface-hover)' }}
                           >
                              {expandedId === result._id ? 'Close Report' : 'View Breakdown'}
                           </button>
                        </td>
                      </tr>
                      {expandedId === result._id && (
                        <tr style={{ background: 'rgba(9, 82, 155, 0.02)' }}>
                          <td colSpan="7" style={{ padding: '2rem' }}>
                             <div className="animate-fade-in">
                               <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                 <FileText size={18} /> Detailed Assessment Breakdown
                               </h4>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                 {result.examId?.questions?.map((q, idx) => {
                                   const studentAnswer = result.answers?.[q._id];
                                   const isCorrect = q.type === 'mcq' && studentAnswer === q.correctAnswer;
                                   
                                   return (
                                     <div key={idx} style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                          <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Q{idx + 1}: {q.questionText}</div>
                                          <div style={{ fontWeight: '800', color: isCorrect ? '#10b981' : 'var(--primary)' }}>
                                            {isCorrect ? q.marks || 1 : 'Manual / Graded'} Marks
                                          </div>
                                        </div>
                                        <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--border)' }}>
                                           <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Your Submission:</span>
                                           <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{studentAnswer || 'NO RESPONSE'}</div>
                                        </div>
                                        {q.type === 'mcq' && !isCorrect && (
                                          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                                            Correct Answer: {q.correctAnswer}
                                          </div>
                                        )}
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Disclaimer */}
        <div style={{ marginTop: '3rem', padding: '2rem', borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
             This transcript is electronically generated and verified by the Mangalore Institute of Technology & Engineering academic portal. Any alteration to this record is strictly prohibited and subject to institutional disciplinary action.
           </p>
           <div style={{ marginTop: '1.5rem', fontWeight: '700', fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
             GENERATED ON {new Date().toLocaleString().toUpperCase()}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Results;
