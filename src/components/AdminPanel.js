import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';
import { Users, Eye, Trash2, Download, Search, ExternalLink } from 'lucide-react';
import Login from './Login';

function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [documentViewer, setDocumentViewer] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchGuests();
    }
  }, [user]);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGuests = async () => {
    try {
      const q = query(collection(db, 'guests'), orderBy('registrationDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const guestsList = [];
      
      querySnapshot.forEach((doc) => {
        guestsList.push({ id: doc.id, ...doc.data() });
      });
      
      setGuests(guestsList);
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast.error('Failed to fetch guest data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterGuests = () => {
    let filtered = [...guests];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(guest => 
        guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.contactNumber?.includes(searchTerm) ||
        guest.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.status === statusFilter);
    }

    setFilteredGuests(filtered);
  };

  const updateGuestStatus = async (guestId, newStatus) => {
    try {
      await updateDoc(doc(db, 'guests', guestId), {
        status: newStatus
      });
      
      setGuests(guests.map(guest => 
        guest.id === guestId ? { ...guest, status: newStatus } : guest
      ));
      
      toast.success(`Guest status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating guest status:', error);
      toast.error('Failed to update guest status');
    }
  };

  const deleteGuest = async (guestId) => {
    if (window.confirm('Are you sure you want to delete this guest registration?')) {
      try {
        await deleteDoc(doc(db, 'guests', guestId));
        setGuests(guests.filter(guest => guest.id !== guestId));
        toast.success('Guest registration deleted');
      } catch (error) {
        console.error('Error deleting guest:', error);
        toast.error('Failed to delete guest registration');
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#059669';
      case 'rejected': return '#dc2626';
      case 'pending': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getIdTypeLabel = (idType) => {
    switch (idType) {
      case 'aadhar': return 'Aadhar Card';
      case 'driving': return 'Driving License';
      case 'voter': return 'Voter ID';
      case 'passport': return 'Passport';
      default: return idType;
    }
  };

  const viewDocument = (guest) => {
    if (guest.identityDocumentUrl) {
      setDocumentViewer({
        url: guest.identityDocumentUrl,
        name: guest.identityDocumentName || `${guest.name}_ID_Document`,
        type: guest.identityDocumentUrl.includes('.pdf') ? 'pdf' : 'image'
      });
    }
  };

  const exportToCSV = () => {
    const csvData = filteredGuests.map(guest => ({
      'Name': guest.name || '',
      'No. of Guests': guest.numberOfGuests || '',
      'Contact Number': guest.contactNumber || '',
      'Nationality': guest.nationality || '',
      'ID Type': getIdTypeLabel(guest.idType) || '',
      'ID Number': guest.idNumber || '',
      'Check-in Date': guest.checkinDate || '',
      'Status': guest.status || '',
      'Registration Date': formatDate(guest.registrationDate)
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest_registrations.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="loading" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '20px' }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={28} color="#667eea" />
            <h2 style={{ margin: 0, color: '#374151' }}>Admin Panel</h2>
          </div>
          <button onClick={() => auth.signOut()} className="btn btn-secondary">
            Sign Out
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div className="grid grid-3" style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <button onClick={exportToCSV} className="btn btn-secondary">
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Total Registrations: {guests.length} | 
            Showing: {filteredGuests.length} | 
            Pending: {guests.filter(g => g.status === 'pending').length} | 
            Approved: {guests.filter(g => g.status === 'approved').length} | 
            Rejected: {guests.filter(g => g.status === 'rejected').length}
          </p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px' }}>Loading guest registrations...</p>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Users size={48} color="#d1d5db" />
            <p style={{ marginTop: '16px', color: '#6b7280' }}>No guest registrations found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Guest Details</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>ID Information</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Check-in</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <strong>{guest.name}</strong>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {guest.numberOfGuests} guest{guest.numberOfGuests > 1 ? 's' : ''} • {guest.nationality}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px' }}>
                        {guest.contactNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px' }}>
                        {getIdTypeLabel(guest.idType)}<br />
                        {guest.idNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {guest.checkinDate ? new Date(guest.checkinDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={guest.status || 'pending'}
                        onChange={(e) => updateGuestStatus(guest.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                          color: getStatusColor(guest.status),
                          fontWeight: '600'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedGuest(guest)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <Eye size={14} />
                        </button>
                        {guest.identityDocumentUrl && (
                          <button
                            onClick={() => viewDocument(guest)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="View Document"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteGuest(guest.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedGuest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedGuest(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Guest Details</h3>
              <button
                onClick={() => setSelectedGuest(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Close
              </button>
            </div>

            <div className="grid grid-2">
              <div>
                <strong>Name:</strong>
                <p>{selectedGuest.name}</p>
              </div>
              <div>
                <strong>No. of Guests:</strong>
                <p>{selectedGuest.numberOfGuests}</p>
              </div>
              <div>
                <strong>Contact Number:</strong>
                <p>{selectedGuest.contactNumber}</p>
              </div>
              <div>
                <strong>Nationality:</strong>
                <p>{selectedGuest.nationality}</p>
              </div>
              <div>
                <strong>ID Type:</strong>
                <p>{getIdTypeLabel(selectedGuest.idType)}</p>
              </div>
              <div>
                <strong>ID Number:</strong>
                <p>{selectedGuest.idNumber}</p>
              </div>
              <div>
                <strong>Check-in Date:</strong>
                <p>{selectedGuest.checkinDate ? new Date(selectedGuest.checkinDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <strong>Status:</strong>
                <p style={{ color: getStatusColor(selectedGuest.status), fontWeight: '600' }}>
                  {selectedGuest.status?.charAt(0).toUpperCase() + selectedGuest.status?.slice(1)}
                </p>
              </div>
            </div>

            {selectedGuest.identityDocumentUrl && (
              <div style={{ marginTop: '20px' }}>
                <strong>ID Document:</strong>
                <p>
                  <button
                    onClick={() => viewDocument(selectedGuest)}
                    className="btn btn-primary"
                  >
                    <ExternalLink size={16} />
                    View Document
                  </button>
                </p>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <strong>Registration Date:</strong>
              <p>{formatDate(selectedGuest.registrationDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {documentViewer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px'
          }}
          onClick={() => setDocumentViewer(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#374151' }}>Document Viewer</h3>
              <button
                onClick={() => setDocumentViewer(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Close
              </button>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '15px', color: '#6b7280' }}>
                <strong>File:</strong> {documentViewer.name}
              </p>
              
              {documentViewer.type === 'pdf' ? (
                <div style={{ background: '#f3f4f6', padding: '40px', borderRadius: '8px' }}>
                  <p style={{ color: '#6b7280', marginBottom: '15px' }}>
                    PDF Preview not available in demo mode
                  </p>
                  <a
                    href={documentViewer.url}
                    download={documentViewer.name}
                    className="btn btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Download size={16} />
                    Download PDF
                  </a>
                </div>
              ) : (
                <div>
                  <img
                    src={documentViewer.url}
                    alt="ID Document"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <div style={{ marginTop: '15px' }}>
                    <a
                      href={documentViewer.url}
                      download={documentViewer.name}
                      className="btn btn-secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Download size={16} />
                      Download Image
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel; 