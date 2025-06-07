document.addEventListener('DOMContentLoaded', () => {
    // 1) FADE-IN ON SCROLL SETUP
    const fadeElements = document.querySelectorAll('.fade-in-element');
  
    const observerOptions = {
      root: null,            // viewport
      rootMargin: '0px',
      threshold: 0.2         // 20% of the element must be visible
    };
  
    const fadeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
  
    fadeElements.forEach(el => {
      fadeObserver.observe(el);
    });
  
    // 2) MOBILE NAV TOGGLE (if you didn't already have it)
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
  
    hamburger?.addEventListener('click', () => {
      if (navLinks.style.display === 'block') {
        navLinks.style.display = 'none';
      } else {
        navLinks.style.display = 'block';
      }
    });
  
    document.querySelectorAll('.nav-links ul li a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinks.style.display = 'none';
        }
      });
    });
  
    // Theme Toggle Functionality
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const themeIcon = themeToggle.querySelector('i');
  
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  
    // Theme toggle click handler
    themeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  
    // Update theme icon
    function updateThemeIcon(theme) {
      themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
  
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.style.display = 'none';
      }
    });
  
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Close mobile menu after clicking
          navLinks.style.display = 'none';
        }
      });
    });
  
    // Add fade-in animation to elements when they come into view
    const featureCards = document.querySelectorAll('.feature-card');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const providerContents = document.querySelectorAll('.provider-content');
  
    const allElements = [...featureCards, ...galleryItems, ...providerContents];
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
  
    allElements.forEach(element => {
      observer.observe(element);
    });
  
    // Auth Form Functionality
    document.addEventListener('DOMContentLoaded', function() {
      // Tab Switching
      const authTabs = document.querySelectorAll('.auth-tab');
      const authForms = document.querySelectorAll('.auth-form');
  
      authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs and forms
          authTabs.forEach(t => t.classList.remove('active'));
          authForms.forEach(f => f.classList.remove('active'));
  
          // Add active class to clicked tab and corresponding form
          tab.classList.add('active');
          const formId = `${tab.dataset.tab}-form`;
          document.getElementById(formId).classList.add('active');
        });
      });
  
      // Password Toggle
      const togglePasswordButtons = document.querySelectorAll('.toggle-password');
      
      togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
          const input = button.previousElementSibling;
          const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
          input.setAttribute('type', type);
          
          // Toggle eye icon
          const icon = button.querySelector('i');
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        });
      });
  
      // Form Validation and Submission
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
  
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          let isValid = true;
  
          const email = document.getElementById('login-email');
          const password = document.getElementById('login-password');
  
          // Clear previous errors
          clearError(email);
          clearError(password);
  
          // Validate email
          if (!email.value) {
            showError(email, 'Email is required');
            isValid = false;
          } else if (!validateEmail(email.value)) {
            showError(email, 'Please enter a valid email address');
            isValid = false;
          }
  
          // Validate password
          if (!password.value) {
            showError(password, 'Password is required');
            isValid = false;
          }
  
          if (isValid) {
            // Here you would typically make an API call to your backend
            console.log('Login attempt:', {
              email: email.value,
              password: password.value,
              remember: document.getElementById('remember').checked
            });
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Login successful! Redirecting...';
            loginForm.appendChild(successMessage);
            
            // Redirect after a short delay
            setTimeout(() => {
              window.location.href = '../index.html';
            }, 2000);
          }
        });
      }
  
      if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
          e.preventDefault();
          let isValid = true;
  
          const name = document.getElementById('register-name');
          const email = document.getElementById('register-email');
          const password = document.getElementById('register-password');
          const confirmPassword = document.getElementById('register-confirm-password');
          const termsCheckbox = registerForm.querySelector('input[type="checkbox"]');
  
          // Clear previous errors
          clearError(name);
          clearError(email);
          clearError(password);
          clearError(confirmPassword);
  
          // Validate name
          if (!name.value) {
            showError(name, 'Full name is required');
            isValid = false;
          }
  
          // Validate email
          if (!email.value) {
            showError(email, 'Email is required');
            isValid = false;
          } else if (!validateEmail(email.value)) {
            showError(email, 'Please enter a valid email address');
            isValid = false;
          }
  
          // Validate password
          if (!password.value) {
            showError(password, 'Password is required');
            isValid = false;
          } else if (!validatePassword(password.value)) {
            showError(password, 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers');
            isValid = false;
          }
  
          // Validate confirm password
          if (!confirmPassword.value) {
            showError(confirmPassword, 'Please confirm your password');
            isValid = false;
          } else if (password.value !== confirmPassword.value) {
            showError(confirmPassword, 'Passwords do not match');
            isValid = false;
          }
  
          // Validate terms checkbox
          if (!termsCheckbox.checked) {
            const checkboxLabel = termsCheckbox.closest('.checkbox-label');
            if (!checkboxLabel.querySelector('.error-message')) {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'error-message';
              errorDiv.textContent = 'You must agree to the terms and conditions';
              checkboxLabel.appendChild(errorDiv);
            }
            isValid = false;
          }
  
          if (isValid) {
            // Here you would typically make an API call to your backend
            console.log('Registration attempt:', {
              name: name.value,
              email: email.value,
              password: password.value
            });
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Registration successful! Redirecting to login...';
            registerForm.appendChild(successMessage);
            
            // Redirect after a short delay
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 2000);
          }
        });
      }
  
      // Social Login Buttons
      const socialButtons = document.querySelectorAll('.btn-social');
      
      socialButtons.forEach(button => {
        button.addEventListener('click', () => {
          const provider = button.classList.contains('google') ? 'Google' : 'Facebook';
          console.log(`${provider} login clicked`);
          // Add your social login logic here
        });
      });
    });
  
    // Form Validation and Submission
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
  
    function validatePassword(password) {
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
      const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
      return re.test(password);
    }
  
    function showError(input, message) {
      const formGroup = input.closest('.form-group');
      const errorDiv = formGroup.querySelector('.error-message') || document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      input.classList.add('error');
      
      if (!formGroup.querySelector('.error-message')) {
        formGroup.appendChild(errorDiv);
      }
    }
  
    function clearError(input) {
      const formGroup = input.closest('.form-group');
      const errorDiv = formGroup.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.remove();
      }
      input.classList.remove('error');
    }
  
    // Add error message styles
    const style = document.createElement('style');
    style.textContent = `
      .error-message {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
  
      .success-message {
        color: #28a745;
        font-size: 1rem;
        margin-top: 1rem;
        text-align: center;
        padding: 1rem;
        background-color: rgba(40, 167, 69, 0.1);
        border-radius: 8px;
      }
  
      .form-group input.error {
        border-color: #dc3545;
      }
  
      .form-group input.error:focus {
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
      }
    `;
    document.head.appendChild(style);
  });
  
