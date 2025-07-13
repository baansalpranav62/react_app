import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from '../cloudinary';
import toast from 'react-hot-toast';
import { User, Phone, Upload, CheckCircle, Users, Calendar, CreditCard, Globe } from 'lucide-react';

function GuestRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

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

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Prepare guest data
      const guestData = {
        ...data,
        identityDocumentUrl: uploadedFiles.map(file => file.url),
        identityDocumentName: uploadedFiles.map(file => file.name),
        registrationDate: serverTimestamp(),
        status: 'pending'
      };

      // Save to Firestore
      await addDoc(collection(db, 'guests'), guestData);
      
      toast.success('Registration submitted successfully!');
      
      // Clean up blob URLs before resetting
      uploadedFiles.forEach(file => {
        if (file?.url && file.url.startsWith('blob:') && !file.isCloudinary) {
          URL.revokeObjectURL(file.url);
        }
      });
      
      reset();
      setUploadedFiles([]);
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
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Please upload a valid image (JPEG, PNG) or PDF file.`);
        continue;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 100MB.`);
        continue;
      }

      setIsUploading(true);
      await handleFileUpload(file);
      setIsUploading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <User size={28} color="#667eea" />
        <h2 style={{ margin: 0, color: '#374151' }}>Guest Registration</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
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
              {...register('name', { 
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
            />
            {errors.name && <p className="error-message">{errors.name.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Users size={18} style={{ display: 'inline', marginRight: '8px' }} />
              No. of Guests *
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter number of guests"
              min="1"
              max="10"
              {...register('numberOfGuests', { 
                required: 'Number of guests is required',
                min: { value: 1, message: 'At least 1 guest required' },
                max: { value: 10, message: 'Maximum 10 guests allowed' }
              })}
            />
            {errors.numberOfGuests && <p className="error-message">{errors.numberOfGuests.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone size={18} style={{ display: 'inline', marginRight: '8px' }} />
              Contact No. *
            </label>
            <input
              type="tel"
              className="form-input"
              placeholder="Enter contact number"
              {...register('contactNumber', { 
                required: 'Contact number is required',
                pattern: {
                  value: /^[0-9]{10,12}$/,
                  message: 'Please enter a valid contact number'
                }
              })}
            />
            {errors.contactNumber && <p className="error-message">{errors.contactNumber.message}</p>}
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
              {...register('nationality', { 
                required: 'Nationality is required',
                minLength: { value: 2, message: 'Please enter valid nationality' }
              })}
            />
            {errors.nationality && <p className="error-message">{errors.nationality.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <CreditCard size={18} style={{ display: 'inline', marginRight: '8px' }} />
              ID Type *
            </label>
            <select
              className="form-select"
              {...register('idType', { required: 'ID type is required' })}
            >
              <option value="">Select ID Type</option>
              <option value="aadhar">Aadhar Card</option>
              <option value="driving">Driving License</option>
              <option value="voter">Voter ID</option>
              <option value="passport">Passport</option>
            </select>
            {errors.idType && <p className="error-message">{errors.idType.message}</p>}
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
              {...register('idNumber', { 
                required: 'ID number is required',
                minLength: { value: 4, message: 'ID number must be at least 4 characters' }
              })}
            />
            {errors.idNumber && <p className="error-message">{errors.idNumber.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={18} style={{ display: 'inline', marginRight: '8px' }} />
              Check-in Date *
            </label>
            <input
              type="date"
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              {...register('checkinDate', { 
                required: 'Check-in date is required',
                validate: (value) => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return selectedDate >= today || 'Check-in date cannot be in the past';
                }
              })}
            />
            {errors.checkinDate && <p className="error-message">{errors.checkinDate.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Upload size={18} style={{ display: 'inline', marginRight: '8px' }} />
              Upload ID Documents
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              onChange={handleFileChange}
              className="form-input"
              style={{ padding: '8px' }}
            />
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={`upload-${idx}`}
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}
                        />
                      ) : (
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
                      )}
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isUploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <div className="loading"></div>
                <span>Uploading documents...</span>
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Upload your ID documents (JPEG, PNG, or PDF, max 100MB each)
            </p>
          </div>
        </div>

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
  );
}

export default GuestRegistration; 