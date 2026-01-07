// backend/serverA/__tests__/integration/validation.test.js

describe('Input Validation Functions', () => {
  
  describe('Email Validation', () => {
    // Mock de la fonction validateEmail
    const validateEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'firstname.lastname@example.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
        'user@@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    // Mock de la fonction validatePassword
    const validatePassword = (password) => {
      // Minimum 8 chars, au moins 1 maj, 1 min, 1 chiffre
      const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      return re.test(password);
    };

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecureP@ss123',
        'MyPassword1',
        'Abcdefgh1',
        'P@ssw0rd',
        'HelloWorld123'
      ];

      strongPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    it('should reject password that is too short', () => {
      expect(validatePassword('short')).toBe(false);
    });

    it('should reject password with no uppercase', () => {
      expect(validatePassword('alllowercase1')).toBe(false);
    });

    it('should reject password with no lowercase', () => {
      expect(validatePassword('ALLUPPERCASE1')).toBe(false);
    });

    it('should reject password with no letters', () => {
      expect(validatePassword('12345678')).toBe(false);
    });

    it('should reject password with no numbers', () => {
      expect(validatePassword('NoNumbersAtAll')).toBe(false);
    });
  });

  describe('Note Title Validation', () => {
    const validateNoteTitle = (title) => {
      return typeof title === 'string' && title.length > 0 && title.length <= 100;
    };

    it('should accept valid titles', () => {
      expect(validateNoteTitle('Valid Title')).toBe(true);
      expect(validateNoteTitle('A')).toBe(true);
      expect(validateNoteTitle('a'.repeat(100))).toBe(true);
    });

    it('should reject invalid titles', () => {
      expect(validateNoteTitle('')).toBe(false);
      expect(validateNoteTitle('a'.repeat(101))).toBe(false);
      expect(validateNoteTitle(null)).toBe(false);
      expect(validateNoteTitle(undefined)).toBe(false);
      expect(validateNoteTitle(123)).toBe(false);
    });
  });

  describe('UUID Validation', () => {
    const isValidUUID = (str) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    it('should accept valid UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      ];

      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        '',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '550e8400-e29b-41d4-a716-44665544000'  // Too short
      ];

      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    const containsPathTraversal = (input) => {
      return input.includes('..') || 
             input.includes('./') || 
             input.includes('~') ||
             input.includes('/etc/') ||
             input.includes('\\');
    };

    it('should detect path traversal attempts', () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '../../malicious',
        './secret',
        '~/.ssh/id_rsa',
        '/etc/shadow',
        'C:\\Windows\\System32'
      ];

      maliciousInputs.forEach(input => {
        expect(containsPathTraversal(input)).toBe(true);
      });
    });

    it('should allow safe paths', () => {
      const safeInputs = [
        'my-note',
        'valid_filename',
        'note-123',
        'Meeting Notes 2024'
      ];

      safeInputs.forEach(input => {
        expect(containsPathTraversal(input)).toBe(false);
      });
    });
  });

  describe('XSS Pattern Detection', () => {
    const containsXSS = (input) => {
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,  // onclick, onerror, etc.
        /<iframe/gi,
        /<object/gi,
        /<embed/gi
      ];

      return xssPatterns.some(pattern => pattern.test(input));
    };

    it('should detect XSS patterns', () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '<a href="javascript:alert(1)">Click</a>',
        '<iframe src="evil.com"></iframe>',
        '<div onclick="malicious()">Click</div>'
      ];

      xssAttempts.forEach(attempt => {
        expect(containsXSS(attempt)).toBe(true);
      });
    });

    it('should allow safe HTML', () => {
      const safeInputs = [
        'Normal text',
        'Text with <b>bold</b>',  // Safe if you allow some HTML
        'Email: test@example.com',
        'http://example.com'
      ];

      safeInputs.forEach(input => {
        // Note: depending on your sanitization policy, adjust this
        const isSafe = !containsXSS(input);
        expect(isSafe).toBe(true);
      });
    });
  });

  describe('SQL Injection Detection (Defensive)', () => {
    const containsSQLInjection = (input) => {
      const sqlPatterns = [
        /(\bOR\b.*?=.*?|--|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b)/i
      ];

      return sqlPatterns.some(pattern => pattern.test(input));
    };

    it('should detect potential SQL injection', () => {
      const sqlAttempts = [
        "' OR '1'='1",
        "1'; DROP TABLE users--",
        "UNION SELECT * FROM passwords",
        "admin'--"
      ];

      sqlAttempts.forEach(attempt => {
        expect(containsSQLInjection(attempt)).toBe(true);
      });
    });

    it('should allow normal inputs', () => {
      const normalInputs = [
        'My Note Title',
        'Shopping list for tomorrow',
        'Meeting notes from 2024-01-15'
      ];

      normalInputs.forEach(input => {
        expect(containsSQLInjection(input)).toBe(false);
      });
    });
  });
});