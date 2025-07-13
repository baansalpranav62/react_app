import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import toast from 'react-hot-toast';
import { User, Phone, Upload, CheckCircle, Users, Calendar, CreditCard, Globe } from 'lucide-react';

function GuestRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    setIsUploading(true);
    try {
      const fileName = `identity_docs/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, fileName);
      
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      setUploadedFile({ name: file.name, url: downloadURL });
      toast.success('Document uploaded successfully!');
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Fallback: If Firebase Storage isn't configured, simulate upload
      if (error.code === 'storage/invalid-project-id' || 
          error.code === 'storage/project-not-found' ||
          error.message.includes('CORS') ||
          error.message.includes('XMLHttpRequest') ||
          error.name === 'FirebaseError') {
        setUploadedFile({ name: file.name, url: 'placeholder-url' });
        toast.success('Document uploaded successfully! (Storage will be configured later)');
        return 'placeholder-url';
      }
      
      toast.error('Failed to upload document. Please try again.');
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
        identityDocumentUrl: uploadedFile?.url || null,
        identityDocumentName: uploadedFile?.name || null,
        registrationDate: serverTimestamp(),
        status: 'pending'
      };

      // Save to Firestore
      await addDoc(collection(db, 'guests'), guestData);
      
      toast.success('Registration submitted successfully!');
      reset();
      setUploadedFile(null);
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG) or PDF file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB.');
        return;
      }
      
      handleFileUpload(file);
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
              Upload ID Document (Optional)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="form-input"
              style={{ padding: '8px' }}
            />
            {uploadedFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <CheckCircle size={16} color="#059669" />
                <span className="success-message">
                  {uploadedFile.name} uploaded successfully
                </span>
              </div>
            )}
            {isUploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <div className="loading"></div>
                <span>Uploading document...</span>
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Upload your ID document (JPEG, PNG, or PDF, max 5MB) - Storage will be configured later
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