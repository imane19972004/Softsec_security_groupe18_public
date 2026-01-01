function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  // Minimum 8 chars, au moins 1 maj, 1 min, 1 chiffre
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
}

function validateNoteTitle(title) {
  return typeof title === 'string' && title.length > 0 && title.length <= 100;
}

export { validateEmail, validatePassword, validateNoteTitle };