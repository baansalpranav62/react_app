import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary, CHECKIN_COLLECTION_URL } from '../cloudinary';
import toast from 'react-hot-toast';
import { User, Phone, Upload, CheckCircle, Users, Calendar, CreditCard, Globe, Download, X, Plus, Minus, ExternalLink, Shield, Lock, FileCheck } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      when: "beforeChildren",
      staggerChildren: 0.15
    }
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.5
    }
  }
};

const formGroupVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 200
    }
  }
};

const securityBadgeVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 100,
      delay: 0.5
    }
  }
};

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const encryptionAnimation = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeInOut"
    }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200
    }
  }
};

const successIconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 100
    }
  }
};

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toLocaleDateString();
  // Firestore Timestamp object
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }
  return String(date);
}

function GuestRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredGuest, setRegisteredGuest] = useState(null);
  const [additionalGuests, setAdditionalGuests] = useState([]);
  const [isSecure, setIsSecure] = useState(false);
  const controls = useAnimation();
  
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

  // Simulate security check animation
  useEffect(() => {
    const simulateSecurityCheck = async () => {
      await controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 }
      });
      setIsSecure(true);
    };
    simulateSecurityCheck();
  }, [controls]);

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
    <AnimatePresence mode="wait">
      <motion.div
        key="registration-form"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="registration-container"
      >
        <div className="card">
          {/* Security Badge */}
          {/* Removed absolute positioning */}

          <motion.div
            variants={formGroupVariants}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div animate={pulseAnimation}>
                <User size={28} color="#667eea" />
              </motion.div>
              <h2 style={{ margin: 0, color: '#374151' }}>Guest Registration</h2>
              {/* Move the security badge here, remove absolute positioning */}
              <motion.div
                className="security-badge"
                variants={securityBadgeVariants}
                animate={isSecure ? "visible" : "hidden"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  color: '#059669',
                  marginLeft: '16px',
                  fontSize: '14px'
                }}
              >
                <Shield size={20} />
                <span>Secure Form</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Security Info Section */}
          <motion.div
            className="security-info"
            variants={formGroupVariants}
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(102, 126, 234, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <motion.div
                animate={{
                  rotate: [0, 360],
                  transition: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
              >
                <Lock size={24} color="#667eea" />
              </motion.div>
              <h3 style={{ margin: 0, color: '#374151', fontSize: '16px' }}>Secure Information Handling</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Shield size={16} color="#667eea" />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>End-to-end encryption</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FileCheck size={16} color="#667eea" />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Secure document storage</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Lock size={16} color="#667eea" />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Privacy protected</span>
              </motion.div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Primary Guest Section */}
            <motion.div
              variants={formGroupVariants}
              style={{ marginBottom: '24px' }}
            >
              <h3 style={{ color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <motion.span animate={pulseAnimation}>
                  <User size={20} color="#667eea" />
                </motion.span>
                Primary Guest Details
              </h3>
              <div className="grid grid-2">
                <motion.div className="form-group" variants={formGroupVariants}>
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
                  {errors.name && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.name.message}
                    </motion.span>
                  )}
                </motion.div>

                <motion.div className="form-group" variants={formGroupVariants}>
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
                  {errors.numberOfGuests && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.numberOfGuests.message}
                    </motion.span>
                  )}
                </motion.div>

                <motion.div className="form-group" variants={formGroupVariants}>
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
                  {errors.contactNumber && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.contactNumber.message}
                    </motion.span>
                  )}
                </motion.div>

                <motion.div className="form-group" variants={formGroupVariants}>
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
                  {errors.nationality && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.nationality.message}
                    </motion.span>
                  )}
                </motion.div>

                <motion.div className="form-group" variants={formGroupVariants}>
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
                  {errors.idType && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.idType.message}
                    </motion.span>
                  )}
                </motion.div>

                <motion.div className="form-group" variants={formGroupVariants}>
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
                  {errors.idNumber && (
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.idNumber.message}
                    </motion.span>
                  )}
                </motion.div>

                <motion.div className="form-group" variants={formGroupVariants}>
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
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.checkinDate.message}
                    </motion.span>
                  )}
                </motion.div>

                <motion.div className="form-group" variants={formGroupVariants}>
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
                    <motion.span
                      className="error-message"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.checkoutDate.message}
                    </motion.span>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Additional Guests Section */}
            <AnimatePresence>
              {additionalGuests.length > 0 && (
                <motion.div
                  key="additional-guests"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ marginTop: '32px', marginBottom: '24px' }}
                >
                  <h3 style={{ color: '#374151', marginBottom: '16px' }}>Additional Guests</h3>
                  {additionalGuests.map((guest, index) => (
                    <motion.div
                      key={index}
                      variants={formGroupVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      style={{
                        marginBottom: '24px',
                        padding: '20px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    >
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
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Upload Section with Enhanced Security Visualization */}
            <motion.div
              className="form-group"
              variants={formGroupVariants}
              style={{ 
                gridColumn: '1 / -1',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <label className="form-label required">
                <Upload size={18} style={{ display: 'inline', marginRight: '8px' }} />
                Identity Documents *
              </label>
              <motion.div
                className={`file-upload ${errors.documents || uploadedFiles.length === 0 ? 'error' : ''}`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  multiple
                  onChange={handleFileChange}
                />
                {/* Encryption Animation Overlay */}
                {isUploading && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                        transition: { duration: 2, repeat: Infinity, ease: "linear" }
                      }}
                    >
                      <Lock size={24} color="#667eea" />
                    </motion.div>
                    <span style={{ marginLeft: '8px', color: '#667eea' }}>Encrypting & Uploading...</span>
                  </motion.div>
                )}
                {/* Show image previews and security badge */}
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <Shield size={18} color="#059669" />
                      <span style={{ color: '#059669', fontSize: '14px', fontWeight: 500 }}>Your IDs are secure</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img
                            src={file.url}
                            alt={file.name}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              background: '#f3f4f6'
                            }}
                          />
                          <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Submit Button with Enhanced Animation */}
            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: '20px' }}
              whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{
                      rotate: 360,
                      transition: { duration: 1, repeat: Infinity, ease: "linear" }
                    }}
                  >
                    <div className="loading"></div>
                  </motion.div>
                  Securely Submitting...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Submit Secure Registration
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Success Modal with animations */}
      <AnimatePresence>
        {showSuccessModal && registeredGuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <motion.div
              className="card"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                maxWidth: '500px',
                width: '100%',
                position: 'relative',
                padding: '30px'
              }}
            >
              <motion.button
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
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} color="#6b7280" />
              </motion.button>

              <motion.div
                style={{ textAlign: 'center', marginBottom: '30px' }}
                variants={itemVariants}
              >
                <motion.div
                  variants={successIconVariants}
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: '#059669',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}
                >
                  <CheckCircle size={30} color="white" />
                </motion.div>
                <motion.h2
                  variants={itemVariants}
                  style={{ margin: '0 0 10px 0', color: '#374151' }}
                >
                  Registration Successful!
                </motion.h2>
                <motion.p
                  variants={itemVariants}
                  style={{ color: '#6b7280', margin: '0' }}
                >
                  Your registration has been submitted successfully.
                </motion.p>
              </motion.div>

              <motion.div style={{ marginBottom: '30px' }} variants={itemVariants}>
                <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '18px' }}>Registration Details</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div>
                    <strong>Primary Guest:</strong> {registeredGuest.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Check-in Date:</strong> {formatDate(registeredGuest.checkinDate)}
                  </div>
                  <div>
                    <strong>Number of Guests:</strong> {registeredGuest.numberOfGuests || 'N/A'}
                  </div>
                  {registeredGuest.additionalGuests?.length > 0 && (
                    <div>
                      <strong>Additional Guests:</strong>
                      <ul style={{ margin: '8px 0 0 20px' }}>
                        {registeredGuest.additionalGuests.map((guest, index) => (
                          <li key={index}>{guest.name || 'N/A'}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <strong>Registration ID:</strong> {registeredGuest.id || 'N/A'}
                  </div>
                </div>
              </motion.div>

              <motion.div style={{ textAlign: 'center' }} variants={itemVariants}>
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
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

export default GuestRegistration; 