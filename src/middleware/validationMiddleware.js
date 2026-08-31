/**
 * Validation Middleware for Corporate Software License & Asset Manager
 */

function validateSoftware(req, res, next) {
  const { softwareName, category, version, vendor, department } = req.body;
  const errors = [];

  if (!softwareName || !softwareName.trim()) errors.push('Software name is required.');
  if (!category || !category.trim()) errors.push('Category is required.');
  if (!version || !version.trim()) errors.push('Version is required.');
  if (!vendor || !vendor.trim()) errors.push('Vendor is required.');
  if (!department || !department.trim()) errors.push('Department is required.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors.join(' ') });
  }

  next();
}

function validateLicense(req, res, next) {
  const { softwareId, totalSeats, startDate, expirationDate, cost } = req.body;
  const errors = [];

  if (!softwareId) errors.push('Software selection is required.');
  if (totalSeats === undefined || totalSeats === null || Number(totalSeats) <= 0) {
    errors.push('Total seats must be a positive integer greater than zero.');
  }
  if (!startDate) errors.push('License start date is required.');
  if (!expirationDate) errors.push('License expiration date is required.');
  if (startDate && expirationDate && new Date(expirationDate) <= new Date(startDate)) {
    errors.push('Expiration date must be later than the start date.');
  }
  if (cost !== undefined && cost !== null && Number(cost) < 0) {
    errors.push('Cost cannot be a negative amount.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors.join(' ') });
  }

  next();
}

function validateEmployee(req, res, next) {
  const { fullName, email, department, jobTitle } = req.body;
  const errors = [];

  if (!fullName || !fullName.trim()) errors.push('Employee full name is required.');
  if (!email || !email.trim()) {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address.');
    }
  }
  if (!department || !department.trim()) errors.push('Department is required.');
  if (!jobTitle || !jobTitle.trim()) errors.push('Job title is required.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors.join(' ') });
  }

  next();
}

function validateVendor(req, res, next) {
  const { vendorName, contactPerson, email, phone } = req.body;
  const errors = [];

  if (!vendorName || !vendorName.trim()) errors.push('Vendor name is required.');
  if (!contactPerson || !contactPerson.trim()) errors.push('Contact person name is required.');
  if (!email || !email.trim()) {
    errors.push('Vendor contact email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid contact email address.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors.join(' ') });
  }

  next();
}

module.exports = {
  validateSoftware,
  validateLicense,
  validateEmployee,
  validateVendor
};
