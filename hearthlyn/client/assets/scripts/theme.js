// Theme toggle functionality
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Update theme
    html.setAttribute('data-theme', newTheme);
    
    // Update icon
    const themeIcon = document.querySelector('.theme-toggle i');
    if (newTheme === 'light') {
        themeIcon.className = 'fas fa-moon';
    } else {
        themeIcon.className = 'fas fa-sun';
    }
    
    // Save preference
    localStorage.setItem('theme', newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set initial icon
    const themeIcon = document.querySelector('.theme-toggle i');
    if (savedTheme === 'light') {
        themeIcon.className = 'fas fa-moon';
    } else {
        themeIcon.className = 'fas fa-sun';
    }
}); 