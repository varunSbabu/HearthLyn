const validator = require('validator');
const { AppError } = require('./errorHandler');

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }
    
    next();
  };
};

// Custom validation functions
const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!validator.isEmail(email)) return 'Please enter a valid email';
  return null;
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  return null;
};

const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!/^\+?[\d\s-()]{10,}$/.test(phone)) return 'Please enter a valid phone number';
  return null;
};

const validatePincode = (pincode) => {
  if (!pincode) return 'Pincode is required';
  if (!/^\d{6}$/.test(pincode)) return 'Please enter a valid 6-digit pincode';
  return null;
};

const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters long';
  if (name.length > 50) return 'Name cannot exceed 50 characters';
  if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
  return null;
};

// User registration validation
const validateUserRegistration = (req, res, next) => {
  const { name, email, password, phone, address } = req.body;
  const errors = [];

  // Validate name
  const nameError = validateName(name);
  if (nameError) errors.push(nameError);

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  // Validate phone
  const phoneError = validatePhone(phone);
  if (phoneError) errors.push(phoneError);

  // Validate address
  if (!address) {
    errors.push('Address is required');
  } else {
    if (!address.street) errors.push('Street address is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    
    const pincodeError = validatePincode(address.pincode);
    if (pincodeError) errors.push(pincodeError);
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(', '), 400));
  }

  next();
};

// Provider registration validation
const validateProviderRegistration = (req, res, next) => {
  const { name, email, password, phone, address, services } = req.body;
  const errors = [];

  // Validate basic fields (same as user)
  const nameError = validateName(name);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  const phoneError = validatePhone(phone);
  if (phoneError) errors.push(phoneError);

  // Validate address
  if (!address) {
    errors.push('Address is required');
  } else {
    if (!address.street) errors.push('Street address is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    
    const pincodeError = validatePincode(address.pincode);
    if (pincodeError) errors.push(pincodeError);
  }

  // Validate services
  if (!services || !Array.isArray(services) || services.length === 0) {
    errors.push('At least one service is required');
  } else {
    services.forEach((service, index) => {
      if (!service.category) errors.push(`Service ${index + 1}: Category is required`);
      if (!service.title) errors.push(`Service ${index + 1}: Title is required`);
      if (!service.description) errors.push(`Service ${index + 1}: Description is required`);
      if (!service.price || !service.price.amount) errors.push(`Service ${index + 1}: Price is required`);
      if (!service.price.unit) errors.push(`Service ${index + 1}: Price unit is required`);
    });
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(', '), 400));
  }

  next();
};

// Login validation
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return next(new AppError(errors.join(', '), 400));
  }

  next();
};

// Service request validation
const validateServiceRequest = (req, res, next) => {
  const { 
    serviceCategory, 
    serviceTitle, 
    description, 
    scheduledDate, 
    scheduledTime, 
    duration, 
    location 
  } = req.body;
  const errors = [];

  if (!serviceCategory) errors.push('Service category is required');
  if (!serviceTitle) errors.push('Service title is required');
  if (!description) errors.push('Service description is required');
  if (description && description.length > 500) errors.push('Description cannot exceed 500 characters');

  // Validate scheduled date
  if (!scheduledDate) {
    errors.push('Scheduled date is required');
  } else {
    const date = new Date(scheduledDate);
    if (isNaN(date.getTime())) {
      errors.push('Invalid scheduled date');
    } else if (date <= new Date()) {
      errors.push('Scheduled date must be in the future');
    }
  }

  // Validate scheduled time
  if (!scheduledTime) {
    errors.push('Scheduled time is required');
  } else {
    if (!scheduledTime.start) errors.push('Start time is required');
    if (!scheduledTime.end) errors.push('End time is required');
    
    if (scheduledTime.start && scheduledTime.end) {
      const startTime = new Date(`2000-01-01 ${scheduledTime.start}`);
      const endTime = new Date(`2000-01-01 ${scheduledTime.end}`);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        errors.push('Invalid time format');
      } else if (startTime >= endTime) {
        errors.push('End time must be after start time');
      }
    }
  }

  // Validate duration
  if (!duration) {
    errors.push('Duration is required');
  } else {
    if (!duration.value || duration.value <= 0) errors.push('Duration value must be greater than 0');
    if (!duration.unit) errors.push('Duration unit is required');
  }

  // Validate location
  if (!location) {
    errors.push('Service location is required');
  } else {
    if (!location.address) errors.push('Service address is required');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(', '), 400));
  }

  next();
};

// Update profile validation
const validateProfileUpdate = (req, res, next) => {
  const { name, phone, address } = req.body;
  const errors = [];

  // Only validate provided fields
  if (name !== undefined) {
    const nameError = validateName(name);
    if (nameError) errors.push(nameError);
  }

  if (phone !== undefined) {
    const phoneError = validatePhone(phone);
    if (phoneError) errors.push(phoneError);
  }

  if (address !== undefined) {
    if (address.pincode) {
      const pincodeError = validatePincode(address.pincode);
      if (pincodeError) errors.push(pincodeError);
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(', '), 400));
  }

  next();
};

// Password change validation
const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword) errors.push('Current password is required');
  
  const passwordError = validatePassword(newPassword);
  if (passwordError) errors.push(passwordError);

  if (!confirmPassword) errors.push('Confirm password is required');
  if (newPassword !== confirmPassword) errors.push('New password and confirm password do not match');

  if (errors.length > 0) {
    return next(new AppError(errors.join(', '), 400));
  }

  next();
};

module.exports = {
  validate,
  validateEmail,
  validatePassword,
  validatePhone,
  validatePincode,
  validateName,
  validateUserRegistration,
  validateProviderRegistration,
  validateLogin,
  validateServiceRequest,
  validateProfileUpdate,
  validatePasswordChange
};