# Manual Testing Document – Frontend Security
## Secure Notes Application – Phase 1

**Document Version:** v2.0  
**Test Type:** Manual Security Testing  
**Scope:** Frontend User Interface, Client-Side Security Controls  
**Test Date Range:** January 2025 – February 2025  
**Test Environment:** Development (HTTPS localhost)

---

## 1. Test Execution Overview

### 1.1 Test Objectives

✅ Verify frontend security controls are functional  
✅ Confirm authentication flows work correctly  
✅ Validate input validation and XSS prevention  
✅ Test authorization enforcement  
✅ Verify error handling (no sensitive data exposure)  

---

### 1.2 Test Environment

**Browser:** Chrome / Edge (latest)  
**OS:** Windows 10 / macOS / Ubuntu  
**Network:** HTTPS (self-signed certificates)  
**Backend:** API server  
**Frontend:** Port 3000 (Node.js server)

---

### 1.3 Test Preconditions

- [ ] Backend server running  
- [ ] Frontend server running on port 3000  
- [ ] HTTPS certificates generated  
- [ ] Browser console open (F12)  
- [ ] Network tab monitoring enabled  
- [ ] Test user accounts created  
- [ ] Database reset between test suites  

---

## 2. Authentication Testing

### Test Suite A: User Registration

#### Test A-01: Valid Registration
**Objective:** Register new user with valid credentials

**Steps:**
1. Navigate to `https://localhost:3000/register.html`
2. Enter email: `testuser@example.com`
3. Enter password: `SecurePass123`
4. Click **Register**

**Expected Results:**
- ✅ Registration succeeds (201 Created)
- ✅ Success message displayed
- ✅ Redirect to login page
- ✅ No console errors
- ✅ POST `/auth/register` visible in network tab

**Security Checks:**
- [ ] Password not sent in URL  
- [ ] Credentials not logged  
- [ ] HTTPS used  

---

#### Test A-02: Weak Password Rejection
**Objective:** Verify weak passwords are rejected

**Steps:**
1. Navigate to register page  
2. Enter email: `testuser2@example.com`  
3. Enter password: `short` (5 chars)  
4. Observe validation feedback  
5. Click **Register**  

**Expected Results:**
- ✅ Password field marked invalid  
- ✅ Password strength indicator shows "Weak"  
- ✅ Rule for "At least 8 characters" marked as invalid  
- ✅ Submit button may be disabled  
- ✅ Error message displayed  
- ✅ Request not sent to backend  

---

#### Test A-03: Missing Password Requirements
**Objective:** Test each password requirement individually

**Test Cases:**
- A-03a: No uppercase letter → `securepass123` → ✅ Error  
- A-03b: No lowercase letter → `SECUREPASS123` → ✅ Error  
- A-03c: No number → `SecurePassABC` → ✅ Error  

**Expected Results:**
- ✅ Requirement marked as failed  
- ✅ Submit disabled or error shown  
- ✅ User cannot proceed until fixed  

---

#### Test A-04: Duplicate Email Registration
**Objective:** Verify duplicate registrations are prevented

**Steps:**
1. Register `duplicate@example.com` successfully  
2. Attempt to register same email again  

**Expected Results:**
- ✅ Registration fails (400 error)  
- ✅ Error message: "Email already registered"  
- ✅ User stays on registration form  
- ✅ Form data cleared (password not preserved)  
- ✅ No console errors  

---

#### Test A-05: Invalid Email Format
**Objective:** Test email validation

**Test Cases:**
- `notanemail` → ✅ Rejected  
- `@example.com` → ✅ Rejected  
- `test@` → ✅ Rejected  
- `test @example.com` → ✅ Rejected  
- `test@example` → ✅ Rejected  

**Expected Results:**
- ✅ Error message shown  
- ✅ Submit button disabled  
- ✅ Form prevents submission  

---

## 3. User Login

### Test Suite B: Authentication

#### Test B-01: Valid Login
**Objective:** Successful authentication

**Steps:**
1. Navigate to `https://localhost:3000/index.html`  
2. Enter registered email and correct password  
3. Click **Sign In**  

**Expected Results:**
- ✅ Login succeeds (200 OK)  
- ✅ Redirects to notes page  
- ✅ HTTP-only cookie set  
- ✅ No console errors  
- ✅ Authorization header contains token  

**Security Checks:**
- [ ] `authToken` cookie marked `HttpOnly`  
- [ ] `Secure` flag set  
- [ ] `SameSite=None`  
- [ ] Password not logged  
- [ ] Token not in localStorage or URL  

---

#### Test B-02: Invalid Password
**Objective:** Reject wrong password

**Steps:**
1. Enter correct email  
2. Enter wrong password: `WrongPass123`  
3. Click **Sign In**  

**Expected Results:**
- ✅ Login fails (401)  
- ✅ Error message: "Invalid credentials"  
- ✅ User stays on login page  
- ✅ Form not cleared  
- ✅ No cookie or token set  

---

#### Test B-03: Non-Existent Email
**Objective:** Handle non-existent user

**Steps:**
1. Enter email: `nonexistent@example.com`  
2. Enter any password  
3. Click **Sign In**  

**Expected Results:**
- ✅ Login fails (401)  
- ✅ Generic error: "Invalid credentials"  
- ✅ User stays on login page  

---

#### Test B-04: Password Visibility Toggle
**Objective:** Show/hide password

**Steps:**
1. Navigate to login page  
2. Enter password  
3. Click eye icon  

**Expected Results:**
- ✅ Password type toggles `text`/`password`  
- ✅ Icon changes accordingly  

---

#### Test B-05: Rate Limiting (Brute Force Protection)
**Objective:** Limit repeated failed login attempts

**Steps:**
1. Attempt login 5 times with wrong password  
2. Try 6th attempt  

**Expected Results:**
- ✅ First 5 attempts: "Invalid credentials"  
- ✅ 6th attempt: 429 error  
- ✅ Message: "Too many login attempts"  

---

## 4. Session Management

### Test Suite C: Session Handling

#### Test C-01: Access Without Authentication
**Objective:** Verify protected pages blocked

**Steps:**
1. Clear cookies/storage  
2. Navigate to `notes.html`  

**Expected Results:**
- ✅ Redirects to login page  
- ✅ No note data shown  
- ✅ API returns 401  

---

#### Test C-02: Token Expiration
**Objective:** Test session timeout

**Steps:**
1. Login successfully  
2. Wait for token expiry  
3. Attempt API call  

**Expected Results:**
- ✅ API returns 401  
- ✅ Redirect to login  
- ✅ Session cleared  

---

#### Test C-03: Logout Functionality
**Objective:** Verify session termination

**Steps:**
1. Login  
2. Click **Logout**  

**Expected Results:**
- ✅ POST `/auth/logout`  
- ✅ Cookie cleared  
- ✅ SessionStorage cleared  
- ✅ Redirect to login  

---

#### Test C-04: Concurrent Sessions
**Objective:** Test multiple logins for same user

**Steps:**
1. Login in two browsers  
2. Access notes  

**Expected Results:**
- ✅ Both sessions work independently  
- ✅ Each has own cookie  
- ✅ Updates from one reflected in other  

---

## 5. Authorization Testing

### Test Suite D: Note Access Control

#### Test D-01: Cross-User Access Prevention
**Objective:** Users cannot access others’ notes

**Steps:**
1. User A creates note  
2. User B tries to access note  

**Expected Results:**
- ✅ API returns 403  
- ✅ Content not displayed  
- ✅ Error message shown  

---

#### Test D-02: Read-Only Access Enforcement
**Objective:** Verify read-only permissions

**Steps:**
1. Share note with User B (read-only)  
2. User B attempts edit  

**Expected Results:**
- ✅ Textarea disabled  
- ✅ Edit/delete buttons hidden  
- ✅ "Read-only" badge shown  
- ✅ API returns 403 on modification  

---

#### Test D-03: Write Permission Enforcement
**Objective:** Verify write access

**Steps:**
1. Share note with write permission  
2. User B edits note  

**Expected Results:**
- ✅ Content editable  
- ✅ Changes saved (200 OK)  
- ✅ "Can Edit" badge shown  
- ✅ Delete remains owner-only  

---

#### Test D-04: Lock Status Enforcement
**Objective:** Prevent concurrent edits

**Steps:**
1. User A opens note and locks it  
2. User B attempts edit  

**Expected Results:**
- ✅ User A sees "Locked by you"  
- ✅ User B sees "Locked by User A"  
- ✅ Textarea disabled for User B  

---

## 6. Input Validation & XSS Prevention

### Test Suite E: XSS Prevention

#### Test E-01 → E-04
**Objective:** Prevent script injection and unsafe characters

**Expected Results:**
- ✅ Script tags not executed  
- ✅ Event handlers stripped  
- ✅ `javascript:` links blocked  
- ✅ Special characters displayed safely  
- ✅ No DOM injection  

---

## 7. Input Length Validation

### Test Suite F

#### Test F-01: Title Length Limit
**Objective:** Verify 100-character limit

**Steps:**
1. Create note  
2. Enter 100 characters in title  
3. Try to add 101st character  

**Expected Results:**
- ✅ Title accepts up to 100 characters  
- ✅ 101st character not added  
- ✅ Counter shows: 100 / 100  
- ✅ Form can be submitted  
- ✅ Counter becomes orange when >80 chars  

#### Test F-02: Content Length Limit
**Objective:** Verify content character limit

**Steps:**
1. Create note with 10,000 characters  
2. Try to add more  

**Expected Results:**
- ✅ Content accepts up to 10,000 characters  
- ✅ 10,001st character not added  
- ✅ Counter shows character count  
- ✅ Form can be submitted  
- ✅ Large content loads without hanging  

#### Test F-03: Oversized Payload Rejection
**Objective:** Test backend rejection of oversized requests

**Steps:**
1. Use DevTools/Burp Suite to modify request  
2. Attempt to send 50KB payload  

**Expected Results:**
- ✅ Request rejected (413 or 400)  
- ✅ Error message: "Payload too large"  
- ✅ Data not stored  
- ✅ User shown error  

---

## 8. Error Handling & Information Disclosure

### Test Suite G: Error Messages

#### Test G-01: Generic Errors
**Objective:** No info leakage

**Test Cases:**
- Invalid note ID → generic error  
- Server overload → generic error  

**Expected Results:**
- ✅ No stack traces, paths, or server details  
- ✅ User-friendly messages  
- ✅ Server logs show details (server-side only)  

#### Test G-02: Form Validation Errors
**Objective:** Helpful but secure validation

**Expected Results:**
- ✅ Clear errors per field  
- ✅ No backend/system info  
- ✅ No API URLs or technical jargon  

#### Test G-03: Network Error Handling
**Objective:** Graceful handling of network failures

**Expected Results:**
- ✅ User-friendly message  
- ✅ Retry suggestion  
- ✅ Failover attempt if applicable  
- ✅ No raw error dumps or sensitive headers  

---

## 9. Failover & Resilience Testing

### Test Suite H: Server Failover

#### Test H-01: Automatic Failover to Server B
**Objective:** The front autonatically switches to serrver B.

**Test Cases:**
- Start both servers and frontend
- The when connected to the front, come back and stop the server A

**Expected Results:** API automatically switches if Server A goes down and u should see it in the login page. 

#### Test H-02: Failback to Primary Server
**Expected Results:** Automatic return to Server A after recovery  

#### Test H-03: Both Servers Down
**Expected Results:** Error shown, max retries enforced  

#### Test H-04: Partial Server Failure
**Expected Results:** Timeout triggers failover, request succeeds  

---

## 10. Browser Security Features

### Test Suite I

#### Test I-01: HttpOnly Cookie
- ✅ Cookies not accessible via JS  

#### Test I-02: Secure Cookie Flag
- ✅ HTTPS-only, HttpOnly, SameSite=None  

#### Test I-03: CORS Protection
- ✅ Cross-origin requests blocked  

#### Test I-04: CSP Violations
- ✅ Inline/untrusted scripts blocked  

---

## 11. UI/UX Security

### Test Suite J

#### Test J-01: Clear Error Messages
- ✅ Helpful and secure  

#### Test J-02: Loading States
- ✅ Buttons disabled/spinner during request  

#### Test J-03: Unsaved Changes Warning
- ✅ Warn on navigation without saving  

---

## 12. Performance & Stability

### Test Suite K

#### Test K-01: Large Note Handling
- ✅ UI responsive with large content  

#### Test K-02: Many Notes (Pagination)
- ✅ List loads smoothly, search/filter fast  
