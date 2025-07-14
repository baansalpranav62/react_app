import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';
import { Users, Eye, Trash2, Download, Search, ExternalLink, ChevronDown, ChevronUp, X, BarChart } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import Login from './Login';
import Analytics from './Analytics';

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
  const [expandedGuests, setExpandedGuests] = useState(new Set());
  const [showAnalytics, setShowAnalytics] = useState(true);

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
        guest.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Also search in additional guests
        guest.additionalGuests?.some(additionalGuest =>
          additionalGuest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          additionalGuest.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
        )
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

  const toggleGuestExpansion = (guestId) => {
    const newExpanded = new Set(expandedGuests);
    if (newExpanded.has(guestId)) {
      newExpanded.delete(guestId);
    } else {
      newExpanded.add(guestId);
    }
    setExpandedGuests(newExpanded);
  };

  const viewDocument = (guest, isAdditionalGuest = false) => {
    if (isAdditionalGuest) {
      if (guest.identityDocumentUrl && guest.identityDocumentUrl.length > 0) {
        setDocumentViewer({
          urls: guest.identityDocumentUrl,
          names: guest.identityDocumentName || guest.identityDocumentUrl.map(() => `${guest.name}_ID_Document`),
          currentIndex: 0,
          type: 'image'
        });
      }
    } else {
      if (guest.identityDocumentUrl) {
        const urls = Array.isArray(guest.identityDocumentUrl) ? guest.identityDocumentUrl : [guest.identityDocumentUrl];
        const names = Array.isArray(guest.identityDocumentName) ? guest.identityDocumentName : [guest.identityDocumentName || `${guest.name}_ID_Document`];
        
        setDocumentViewer({
          urls,
          names,
          currentIndex: 0,
          type: 'image'
        });
      }
    }
  };

  const downloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const exportToExcel = async () => {
    let loadingToast;
    try {
      setIsLoading(true);
      loadingToast = toast.loading('Preparing export...');

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Prepare the data rows (including additional guests)
      const wsData = [];
      
      filteredGuests.forEach(guest => {
        // Add primary guest
        const primaryGuestUrls = Array.isArray(guest.identityDocumentUrl) 
          ? guest.identityDocumentUrl.join('\n') 
          : guest.identityDocumentUrl || '';

        wsData.push({
          'Guest Type': 'Primary',
          'Name': guest.name || '',
          'No. of Guests': guest.numberOfGuests || '',
          'Contact Number': guest.contactNumber || '',
          'Nationality': guest.nationality || '',
          'ID Type': getIdTypeLabel(guest.idType) || '',
          'ID Number': guest.idNumber || '',
          'Check-in Date': guest.checkinDate || '',
          'Status': guest.status || '',
          'Registration Date': formatDate(guest.registrationDate),
          'Document URLs': primaryGuestUrls
        });

        // Add additional guests if any
        if (guest.additionalGuests && guest.additionalGuests.length > 0) {
          guest.additionalGuests.forEach((additionalGuest, index) => {
            const additionalGuestUrls = Array.isArray(additionalGuest.identityDocumentUrl) 
              ? additionalGuest.identityDocumentUrl.join('\n') 
              : additionalGuest.identityDocumentUrl || '';

            wsData.push({
              'Guest Type': `Additional Guest ${index + 1}`,
              'Name': additionalGuest.name || '',
              'No. of Guests': '',
              'Contact Number': '',
              'Nationality': additionalGuest.nationality || '',
              'ID Type': getIdTypeLabel(additionalGuest.idType) || '',
              'ID Number': additionalGuest.idNumber || '',
              'Check-in Date': guest.checkinDate || '',
              'Status': guest.status || '',
              'Registration Date': formatDate(guest.registrationDate),
              'Document URLs': additionalGuestUrls
            });
          });
        }
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Guest Type
        { wch: 20 }, // Name
        { wch: 15 }, // No. of Guests
        { wch: 15 }, // Contact Number
        { wch: 15 }, // Nationality
        { wch: 15 }, // ID Type
        { wch: 15 }, // ID Number
        { wch: 15 }, // Check-in Date
        { wch: 15 }, // Status
        { wch: 20 }, // Registration Date
        { wch: 100 }, // Document URLs
      ];

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Guest Registrations');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Get current date for filename
      const date = new Date().toISOString().split('T')[0];
      saveAs(data, `guest_registrations_${date}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success('Export completed successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="admin-panel">
      <div className="header">
        <div className="title">
          <Users size={28} color="#667eea" />
          <h1>Guest Registrations</h1>
        </div>
        
        <div className="filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name, contact, or nationality"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <button onClick={exportToExcel} className="export-btn" disabled={isLoading}>
            <Download size={20} />
            Export to Excel
          </button>

          <button
            className="action-btn"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart size={20} />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {showAnalytics && <Analytics guests={guests} />}

      <div className="guests-list">
        {isLoading ? (
          <div>Loading...</div>
        ) : filteredGuests.length === 0 ? (
          <div>No guests found</div>
        ) : (
          filteredGuests.map(guest => (
            <div key={guest.id} className="guest-card">
              <div className="guest-header" onClick={() => toggleGuestExpansion(guest.id)}>
                <div className="guest-info">
                  <h3>{guest.name}</h3>
                  <span className="guest-meta">
                    {guest.contactNumber} • {formatDate(guest.registrationDate)}
                  </span>
                </div>
                
                <div className="guest-actions">
                  <span className={`status-badge ${guest.status}`}>
                    {guest.status}
                  </span>
                  
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewDocument(guest);
                    }}
                  >
                    <Eye size={18} />
                    View Documents
                  </button>
                  
                  <select
                    value={guest.status}
                    onChange={(e) => updateGuestStatus(guest.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ backgroundColor: getStatusColor(guest.status) }}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <button
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGuest(guest.id);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  {expandedGuests.has(guest.id) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>

              {expandedGuests.has(guest.id) && (
                <div className="guest-details">
                  <div className="guest-section">
                    <h4>Primary Guest Details</h4>
                    <div className="details-grid">
                      <div>
                        <strong>Check-in Date:</strong> {guest.checkinDate}
                      </div>
                      <div>
                        <strong>Contact Number:</strong> {guest.contactNumber}
                      </div>
                      <div>
                        <strong>Nationality:</strong> {guest.nationality}
                      </div>
                      <div>
                        <strong>ID Type:</strong> {getIdTypeLabel(guest.idType)}
                      </div>
                      <div>
                        <strong>ID Number:</strong> {guest.idNumber}
                      </div>
                      <div>
                        <strong>Number of Guests:</strong> {guest.numberOfGuests}
                      </div>
                    </div>
                  </div>

                  {guest.additionalGuests && guest.additionalGuests.length > 0 && (
                    <div className="additional-guests">
                      <h4>Additional Guests</h4>
                      {guest.additionalGuests.map((additionalGuest, index) => (
                        <div key={index} className="additional-guest-card">
                          <div className="additional-guest-info">
                            <h5>{additionalGuest.name || `Guest ${index + 2}`}</h5>
                            <div className="details-grid">
                              <div>
                                <strong>Nationality:</strong> {additionalGuest.nationality}
                              </div>
                              <div>
                                <strong>ID Type:</strong> {getIdTypeLabel(additionalGuest.idType)}
                              </div>
                              <div>
                                <strong>ID Number:</strong> {additionalGuest.idNumber}
                              </div>
                            </div>
                          </div>
                          <div className="additional-guest-actions">
                            {additionalGuest.identityDocumentUrl && additionalGuest.identityDocumentUrl.length > 0 && (
                              <button
                                className="action-btn"
                                onClick={() => viewDocument(additionalGuest, true)}
                              >
                                <Eye size={18} />
                                View Documents
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Document Viewer Modal */}
      {documentViewer && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setDocumentViewer(null)}>
              <X size={24} />
            </button>
            
            <div className="document-viewer">
              <img
                src={documentViewer.urls[documentViewer.currentIndex]}
                alt="Document"
                style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
              />
              
              <div className="document-actions">
                <p>{documentViewer.names[documentViewer.currentIndex]}</p>
                <div className="action-buttons">
                  <a
                    href={documentViewer.urls[documentViewer.currentIndex]}
                    download
                    className="download-link"
                  >
                    <Download size={18} />
                    Download Image
                  </a>
                  <a
                    href={documentViewer.urls[documentViewer.currentIndex]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    <ExternalLink size={18} />
                    Open in New Tab
                  </a>
                </div>
                {documentViewer.urls.length > 1 && (
                  <div className="document-navigation">
                    <button
                      onClick={() => setDocumentViewer({
                        ...documentViewer,
                        currentIndex: Math.max(0, documentViewer.currentIndex - 1)
                      })}
                      disabled={documentViewer.currentIndex === 0}
                    >
                      Previous
                    </button>
                    <span>
                      {documentViewer.currentIndex + 1} of {documentViewer.urls.length}
                    </span>
                    <button
                      onClick={() => setDocumentViewer({
                        ...documentViewer,
                        currentIndex: Math.min(documentViewer.urls.length - 1, documentViewer.currentIndex + 1)
                      })}
                      disabled={documentViewer.currentIndex === documentViewer.urls.length - 1}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel; 