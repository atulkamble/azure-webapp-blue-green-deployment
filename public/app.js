// Fetch and display application info
async function loadAppInfo() {
    try {
        const response = await fetch('/api/info');
        const data = await response.json();
        
        // Update environment info
        document.getElementById('environment').textContent = data.environment || 'production';
        document.getElementById('nodeVersion').textContent = data.nodeVersion || 'N/A';
        document.getElementById('appVersion').textContent = data.version || '1.0.0';
        
    } catch (error) {
        console.error('Error loading app info:', error);
        document.getElementById('environment').textContent = 'Error';
        document.getElementById('nodeVersion').textContent = 'Error';
        document.getElementById('appVersion').textContent = 'Error';
    }
}

// Check health status
async function checkHealth() {
    const badge = document.getElementById('statusBadge');
    
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (response.ok && data.status === 'healthy') {
            badge.classList.add('healthy');
            badge.querySelector('span:last-child').textContent = 'Healthy';
        } else {
            badge.classList.remove('healthy');
            badge.querySelector('span:last-child').textContent = 'Unhealthy';
        }
    } catch (error) {
        console.error('Error checking health:', error);
        badge.classList.remove('healthy');
        badge.querySelector('span:last-child').textContent = 'Offline';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAppInfo();
    checkHealth();
    
    // Check health every 30 seconds
    setInterval(checkHealth, 30000);
});
