import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary, CHECKIN_COLLECTION_URL } from '../cloudinary';
import toast from 'react-hot-toast';
import { User, Phone, Upload, CheckCircle, Users, Calendar, CreditCard, Globe, Download, X, Plus, Minus, ExternalLink } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function GuestRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredGuest, setRegisteredGuest] = useState(null);
  const [additionalGuests, setAdditionalGuests] = useState([]);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm();

  const numberOfGuests = watch('numberOfGuests', 1);
  const checkinDate = watch('checkinDate');

  // Update checkout date when checkin date changes
  useEffect(() => {
    if (checkinDate) {
      const nextDay = new Date(checkinDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setValue('checkoutDate', nextDay);
    }
  }, [checkinDate, setValue]);

  useEffect(() => {
    const newGuestCount = parseInt(numberOfGuests) || 1;
    if (newGuestCount > 1) {
      const currentAdditionalGuests = [...additionalGuests];
      while (currentAdditionalGuests.length < newGuestCount - 1) {
        currentAdditionalGuests.push({
          name: '',
          nationality: '',
          idType: '',
          idNumber: '',
          documents: []
        });
      }
      while (currentAdditionalGuests.length > newGuestCount - 1) {
        currentAdditionalGuests.pop();
      }
      setAdditionalGuests(currentAdditionalGuests);
    } else {
      setAdditionalGuests([]);
    }
  }, [numberOfGuests]);

  // Cleanup blob URLs on component unmount (only for non-Cloudinary files)
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file?.url && file.url.startsWith('blob:') && !file.isCloudinary) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [uploadedFiles]);

  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    setIsUploading(true);
    
    try {
      // Try Cloudinary upload first
      try {
        const cloudinaryResult = await uploadToCloudinary(file);
        
        const fileInfo = {
          name: file.name,
          size: cloudinaryResult.size,
          type: file.type,
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          isCloudinary: true
        };
        
        setUploadedFiles(prev => [...prev, fileInfo]);
        toast.success(`${file.name} uploaded successfully to Cloudinary!`);
        return cloudinaryResult.url;
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
        
        // Fallback to blob URL for demo mode
        const blobUrl = URL.createObjectURL(file);
        
        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          url: blobUrl,
          originalFile: file,
          isCloudinary: false
        };
        
        setUploadedFiles(prev => [...prev, fileInfo]);
        toast.success(`${file.name} uploaded successfully! (Demo mode - Configure Cloudinary for cloud storage)`);
        return blobUrl;
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process document. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdditionalGuestChange = (index, field, value) => {
    const updatedGuests = [...additionalGuests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      [field]: value
    };
    setAdditionalGuests(updatedGuests);
  };

  const handleAdditionalGuestFileUpload = async (index, files) => {
    setIsUploading(true);
    
    try {
      const uploadedDocs = [];
      for (const file of files) {
        const result = await handleFileUpload(file);
        if (result) {
          uploadedDocs.push({
            url: result,
            name: file.name
          });
        }
      }
      
      const updatedGuests = [...additionalGuests];
      updatedGuests[index] = {
        ...updatedGuests[index],
        documents: [...(updatedGuests[index].documents || []), ...uploadedDocs]
      };
      setAdditionalGuests(updatedGuests);
    } catch (error) {
      console.error('Error uploading additional guest documents:', error);
      toast.error('Failed to upload documents for additional guest');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    // Validate mandatory image upload
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one identity document');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare primary guest data
      const primaryGuestData = {
        ...data,
        identityDocumentUrl: uploadedFiles.map(file => file.url),
        identityDocumentName: uploadedFiles.map(file => file.name),
        registrationDate: serverTimestamp(),
        status: 'pending'
      };

      // Validate additional guests' documents
      const hasInvalidAdditionalGuests = additionalGuests.some(
        (guest, index) => !guest.documents || guest.documents.length === 0
      );

      if (hasInvalidAdditionalGuests) {
        toast.error('Please upload identity documents for all additional guests');
        setIsSubmitting(false);
        return;
      }

      // Prepare additional guests data
      const additionalGuestsData = additionalGuests.map(guest => ({
        name: guest.name,
        nationality: guest.nationality,
        idType: guest.idType,
        idNumber: guest.idNumber,
        identityDocumentUrl: guest.documents?.map(doc => doc.url) || [],
        identityDocumentName: guest.documents?.map(doc => doc.name) || []
      }));

      // Combine all guest data
      const guestData = {
        ...primaryGuestData,
        additionalGuests: additionalGuestsData
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'guests'), guestData);
      
      // Set the registered guest data for the success modal
      setRegisteredGuest({
        ...guestData,
        id: docRef.id
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Clean up blob URLs
      uploadedFiles.forEach(file => {
        if (file?.url && file.url.startsWith('blob:') && !file.isCloudinary) {
          URL.revokeObjectURL(file.url);
        }
      });
      
      reset();
      setUploadedFiles([]);
      setAdditionalGuests([]);
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate each file
    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Please upload a valid image (JPEG, PNG, GIF, WebP).`);
        continue;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 10MB.`);
        continue;
      }

      setIsUploading(true);
      await handleFileUpload(file);
      setIsUploading(false);
    }
  };

  // Add a function to open check-in details
  const openCheckinDetails = () => {
    window.open(CHECKIN_COLLECTION_URL, '_blank', 'noopener,noreferrer');
  };

  // Custom date input component
  const CustomDateInput = React.forwardRef(({ value, onClick, placeholder, hasError }, ref) => (
    <div className="custom-date-input" onClick={onClick}>
      <input
        ref={ref}
        value={value}
        className={`form-input date-input ${hasError ? 'error' : ''}`}
        placeholder={placeholder}
        readOnly
      />
      <Calendar className="calendar-icon" size={18} />
    </div>
  ));

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={28} color="#667eea" />
            <h2 style={{ margin: 0, color: '#374151' }}>Guest Registration</h2>
          </div>
          
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Primary Guest Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#374151', marginBottom: '16px' }}>Primary Guest Details</h3>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  <User size={18} />
                  Name *
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter guest name"
                  {...register('name', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                />
                {errors.name && <span className="error-message">{errors.name.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Users size={18} />
                  No. of Guests *
                </label>
                <input
                  type="number"
                  className={`form-input ${errors.numberOfGuests ? 'error' : ''}`}
                  placeholder="Enter number of guests"
                  min="1"
                  max="10"
                  {...register('numberOfGuests', { 
                    required: 'Number of guests is required',
                    min: { value: 1, message: 'At least 1 guest required' },
                    max: { value: 10, message: 'Maximum 10 guests allowed' }
                  })}
                />
                {errors.numberOfGuests && <span className="error-message">{errors.numberOfGuests.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={18} />
                  Contact No. *
                </label>
                <input
                  type="tel"
                  className={`form-input ${errors.contactNumber ? 'error' : ''}`}
                  placeholder="Enter contact number"
                  {...register('contactNumber', { 
                    required: 'Contact number is required',
                    pattern: {
                      value: /^[0-9]{10,12}$/,
                      message: 'Please enter a valid contact number'
                    }
                  })}
                />
                {errors.contactNumber && <span className="error-message">{errors.contactNumber.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Globe size={18} />
                  Nationality *
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.nationality ? 'error' : ''}`}
                  placeholder="Enter nationality"
                  {...register('nationality', { 
                    required: 'Nationality is required',
                    minLength: { value: 2, message: 'Please enter valid nationality' }
                  })}
                />
                {errors.nationality && <span className="error-message">{errors.nationality.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={18} />
                  ID Type *
                </label>
                <select
                  className={`form-select ${errors.idType ? 'error' : ''}`}
                  {...register('idType', { required: 'ID type is required' })}
                >
                  <option value="">Select ID Type</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="driving">Driving License</option>
                  <option value="voter">Voter ID</option>
                  <option value="passport">Passport</option>
                </select>
                {errors.idType && <span className="error-message">{errors.idType.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={18} />
                  ID Number *
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.idNumber ? 'error' : ''}`}
                  placeholder="Enter ID number"
                  {...register('idNumber', { 
                    required: 'ID number is required',
                    minLength: { value: 4, message: 'ID number must be at least 4 characters' }
                  })}
                />
                {errors.idNumber && <span className="error-message">{errors.idNumber.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={18} style={{ display: 'inline', marginRight: '8px' }} />
                  Check-in Date *
                </label>
                <Controller
                  control={control}
                  name="checkinDate"
                  rules={{
                    required: 'Check-in date is required',
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selectedDate >= today || 'Check-in date cannot be in the past';
                    }
                  }}
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      selected={value}
                      onChange={onChange}
                      minDate={new Date()}
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Select check-in date"
                      customInput={<CustomDateInput hasError={!!errors.checkinDate} />}
                      showPopperArrow={false}
                      calendarClassName="custom-calendar"
                      popperClassName="custom-popper"
                      popperPlacement="bottom-start"
                      shouldCloseOnSelect
                      showTimeSelect={false}
                    />
                  )}
                />
                {errors.checkinDate && (
                  <span className="error-message">{errors.checkinDate.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={18} style={{ display: 'inline', marginRight: '8px' }} />
                  Check-out Date *
                </label>
                <Controller
                  control={control}
                  name="checkoutDate"
                  rules={{
                    required: 'Check-out date is required',
                    validate: value => {
                      const checkIn = new Date(checkinDate);
                      const checkOut = new Date(value);
                      return checkOut > checkIn || 'Check-out date must be after check-in date';
                    }
                  }}
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      selected={value}
                      onChange={onChange}
                      minDate={checkinDate ? new Date(checkinDate) : new Date()}
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Select check-out date"
                      customInput={<CustomDateInput hasError={!!errors.checkoutDate} />}
                      showPopperArrow={false}
                      calendarClassName="custom-calendar"
                      popperClassName="custom-popper"
                      popperPlacement="bottom-start"
                      shouldCloseOnSelect
                      showTimeSelect={false}
                    />
                  )}
                />
                {errors.checkoutDate && (
                  <span className="error-message">{errors.checkoutDate.message}</span>
                )}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label required">
                  <Upload size={18} style={{ display: 'inline', marginRight: '8px' }} />
                  Identity Documents *
                </label>
                <div className={`file-upload ${errors.documents || uploadedFiles.length === 0 ? 'error' : ''}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    multiple
                    onChange={handleFileChange}
                  />
                  {uploadedFiles.length === 0 && (
                    <span className="error-message">At least one identity document is required</span>
                  )}
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Upload your ID documents (JPEG, PNG, GIF, WebP, max 10MB each)
                  </p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="uploaded-file">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                          }}
                          className="remove-file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Guests Section */}
          {additionalGuests.length > 0 && (
            <div style={{ marginTop: '32px', marginBottom: '24px' }}>
              <h3 style={{ color: '#374151', marginBottom: '16px' }}>Additional Guests</h3>
              {additionalGuests.map((guest, index) => (
                <div key={index} style={{ 
                  marginBottom: '24px',
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ color: '#374151', marginBottom: '16px' }}>Guest {index + 2}</h4>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">
                        <User size={18} style={{ display: 'inline', marginRight: '8px' }} />
                        Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter guest name"
                        value={guest.name}
                        onChange={(e) => handleAdditionalGuestChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <Globe size={18} style={{ display: 'inline', marginRight: '8px' }} />
                        Nationality *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter nationality"
                        value={guest.nationality}
                        onChange={(e) => handleAdditionalGuestChange(index, 'nationality', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <CreditCard size={18} style={{ display: 'inline', marginRight: '8px' }} />
                        ID Type *
                      </label>
                      <select
                        className="form-select"
                        value={guest.idType}
                        onChange={(e) => handleAdditionalGuestChange(index, 'idType', e.target.value)}
                        required
                      >
                        <option value="">Select ID Type</option>
                        <option value="aadhar">Aadhar Card</option>
                        <option value="driving">Driving License</option>
                        <option value="voter">Voter ID</option>
                        <option value="passport">Passport</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <CreditCard size={18} style={{ display: 'inline', marginRight: '8px' }} />
                        ID Number *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter ID number"
                        value={guest.idNumber}
                        onChange={(e) => handleAdditionalGuestChange(index, 'idNumber', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <Upload size={18} style={{ display: 'inline', marginRight: '8px' }} />
                        Upload ID Documents
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        multiple
                        onChange={(e) => handleAdditionalGuestFileUpload(index, Array.from(e.target.files))}
                        className="form-input"
                        style={{ padding: '8px' }}
                      />
                      {guest.documents && guest.documents.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                            {guest.documents.map((doc, docIdx) => (
                              <div key={docIdx} style={{ position: 'relative' }}>
                                {doc.name.toLowerCase().endsWith('.pdf') ? (
                                  <div
                                    style={{
                                      width: '100px',
                                      height: '100px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: '#f3f4f6',
                                      borderRadius: '8px',
                                      border: '1px solid #e5e7eb'
                                    }}
                                  >
                                    PDF
                                  </div>
                                ) : (
                                  <img
                                    src={doc.url}
                                    alt={`upload-${docIdx}`}
                                    style={{
                                      width: '100px',
                                      height: '100px',
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                      border: '1px solid #e5e7eb'
                                    }}
                                  />
                                )}
                                <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {doc.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '20px' }}
          >
            {isSubmitting ? (
              <>
                <div className="loading"></div>
                Submitting Registration...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Submit Registration
              </>
            )}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && registeredGuest && (
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
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              position: 'relative',
              padding: '30px'
            }}
          >
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              <X size={24} color="#6b7280" />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: '#059669',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <CheckCircle size={30} color="white" />
              </div>
              <h2 style={{ margin: '0 0 10px 0', color: '#374151' }}>Registration Successful!</h2>
              <p style={{ color: '#6b7280', margin: '0' }}>
                Your registration has been submitted successfully.
              </p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '18px' }}>Registration Details</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div>
                  <strong>Primary Guest:</strong> {registeredGuest.name}
                </div>
                <div>
                  <strong>Check-in Date:</strong> {registeredGuest.checkinDate}
                </div>
                <div>
                  <strong>Number of Guests:</strong> {registeredGuest.numberOfGuests}
                </div>
                {registeredGuest.additionalGuests?.length > 0 && (
                  <div>
                    <strong>Additional Guests:</strong>
                    <ul style={{ margin: '8px 0 0 20px' }}>
                      {registeredGuest.additionalGuests.map((guest, index) => (
                        <li key={index}>{guest.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <strong>Registration ID:</strong> {registeredGuest.id}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '15px', color: '#6b7280' }}>
                Please download your check-in details and instructions below
              </p>
              <a
                href={CHECKIN_COLLECTION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none'
                }}
                onClick={(e) => {
                  if (!CHECKIN_COLLECTION_URL) {
                    e.preventDefault();
                    toast.error('Check-in details are not available at the moment');
                  }
                }}
              >
                <Download size={20} />
                Download Check-in Details
              </a>
              <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                Your registration ID: {registeredGuest.id}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GuestRegistration; 