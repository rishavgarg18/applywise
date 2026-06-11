const FIELD_ALIASES = {
  'first name': 'firstName', 'firstname': 'firstName', 'fname': 'firstName',
  'last name': 'lastName', 'lastname': 'lastName', 'surname': 'lastName',
  'full name': 'fullName', 'name': 'fullName', 'email': 'email', 'e-mail': 'email',
  'phone': 'phone', 'mobile': 'phone', 'phone number': 'phone',
  'city': 'city', 'state': 'state', 'country': 'country', 'pincode': 'pinCode',
  'linkedin': 'linkedin', 'github': 'github', 'portfolio': 'portfolio',
  'designation': 'currentDesignation', 'current company': 'currentCompany',
  'experience': 'totalExperience', 'skills': 'primarySkills', 'summary': 'summary',
  'about me': 'summary', 'cover letter': 'summary', 'notice period': 'noticePeriod',
  'current ctc': 'currentCTC', 'expected ctc': 'expectedCTC'
};

function normalizeLabel(label) {
  return (label || '').toLowerCase().replace(/[*:]/g, '').replace(/\s+/g, ' ').trim();
}

function ruleBasedMapping(fields, profile) {
  const mapping = {};
  for (const field of fields) {
    const norm = normalizeLabel(field.label);
    let value = null;
    for (const [alias, key] of Object.entries(FIELD_ALIASES)) {
      if (norm.includes(alias) || norm === alias) { value = profile[key]; break; }
    }
    if (value == null && field.type === 'email') value = profile.email;
    if (value == null && field.type === 'tel') value = profile.phone;
    if (value != null && value !== '') mapping[field.label] = String(value);
  }
  return mapping;
}
