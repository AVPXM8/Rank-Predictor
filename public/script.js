// new without otp simple 
class NIMCETRankPredictor {
    constructor() {
        this.userToken = localStorage.getItem('nimcetToken');
        this.userPhone = localStorage.getItem('nimcetPhone');
        this.userName = localStorage.getItem('nimcetName');
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkExistingSession();
    }
    
    initializeElements() {
        // Steps
        this.phoneStep = document.getElementById('phoneStep');
        this.predictionStep = document.getElementById('predictionStep');
        
        // Initial form elements
        this.phoneInput = document.getElementById('phoneNumber');
        this.fullNameInput = document.getElementById('fullName');
        this.startPredictionBtn = document.getElementById('startPredictionBtn');
        
        // Prediction elements
        this.marksInput = document.getElementById('marksInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.predictBtn = document.getElementById('predictBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // User info display elements
        this.userFullName = document.getElementById('userFullName');
        this.avatar = document.getElementById('avatar');
        this.verifiedPhone = document.getElementById('verifiedPhone');
        
        // Results & other elements
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toast = document.getElementById('toast');
    }
    
    attachEventListeners() {
        this.startPredictionBtn.addEventListener('click', () => this.registerGuest());
        this.predictBtn.addEventListener('click', () => this.predictRank());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Enable predict button only when marks are valid
        this.marksInput.addEventListener('input', () => {
            const marks = parseInt(this.marksInput.value, 10);
            this.predictBtn.disabled = !marks || marks <= 0 || marks > 1000;
        });
    }

    checkExistingSession() {
        if (this.userToken && this.userPhone && this.userName) {
            this.showStep('prediction');
            this.updateUserInfo(this.userName, this.userPhone);
        } else {
            this.showStep('phone');
        }
    }

    showStep(step) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById(`${step}Step`).classList.add('active');
    }
    
    async registerGuest() {
        const fullName = this.fullNameInput.value.trim();
        const phoneNumber = this.phoneInput.value.trim();

        if (fullName.length < 2) {
            this.showToast('Please enter a valid full name.', 'error');
            return;
        }
        if (phoneNumber.length !== 10) {
            this.showToast('Please enter a valid 10-digit phone number.', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/register-guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, phoneNumber })
            });
            const data = await response.json();

            if (data.success) {
                this.userToken = data.token;
                this.userPhone = data.user.phoneNumber;
                this.userName = data.user.fullName;

                localStorage.setItem('nimcetToken', this.userToken);
                localStorage.setItem('nimcetPhone', this.userPhone);
                localStorage.setItem('nimcetName', this.userName);

                this.showToast(`Welcome, ${this.userName}!`, 'success');
                this.showStep('prediction');
                this.updateUserInfo(this.userName, this.userPhone);
            } else {
                this.showToast(data.message || 'Registration failed.', 'error');
            }
        } catch (error) {
            this.showToast('A network error occurred. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateUserInfo(name, phone) {
        if (this.userFullName) this.userFullName.textContent = name;
        if (this.verifiedPhone) this.verifiedPhone.textContent = phone;
        if (this.avatar) this.avatar.textContent = name.charAt(0).toUpperCase();
    }
    
    async predictRank() {
        const marks = parseInt(this.marksInput.value);
        const category = this.categorySelect.value;
        
        if (!marks || marks <= 0 || marks > 1000) {
            this.showToast('Please enter valid marks between 1 and 1000.', 'error');
            return;
        }
        
        this.showLoading(true);
        this.resultsContainer.style.display = 'none'; // Hide old results
        this.resultsContainer.innerHTML = ''; // Clear old results

        try {
            const response = await fetch('/api/predict-rank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marks, category, token: this.userToken })
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.displayResults(data.prediction);
                this.showToast('Rank predicted successfully!', 'success');
            } else {
                 this.showToast(data.message || 'Could not get prediction.', 'error');
            }
        } catch (error) {
            this.showToast('A network error occurred during prediction.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

displayResults(prediction) {
    // This function dynamically creates and adds the result cards
    const resultsHTML = `
        <div class="result-card">
            <div class="result-header"><i class="fas fa-trophy"></i><h3>Your Predicted Rank</h3></div>
            <div class="result-body">
                <div class="rank-display">
                    <span class="rank-range">${prediction.rankRange.min.toLocaleString()} - ${prediction.rankRange.max.toLocaleString()}</span>
                    <p class="rank-message">Your Predicted ${prediction.category} Rank</p>
                </div>
            </div>
        </div>
        <div class="colleges-section">
            <div class="colleges-header"><i class="fas fa-university"></i><h3>Recommended Colleges</h3><span class="colleges-count">${prediction.colleges.length} colleges found</span></div>
            <div class="colleges-list">
                 ${prediction.colleges.length > 0 ? prediction.colleges.map(college => `
                    <div class="college-card">
                        <h4>${college.name}</h4>
                        <p class="college-location"><i class="fas fa-map-marker-alt"></i> ${college.location}</p>
                    </div>
                `).join('') : '<div class="no-colleges"><p>No colleges found for this rank range and category.</p></div>'}
            </div>
        </div>
        
        <div class="promo-banner">
            <a href="https://play.google.com/store/apps/details?id=com.maarula.classes&pcampaignid=web_share" target="_blank">
                <img src="promo-banner.jpg" alt="Maarula Mathem App ">
            </a>
        </div>
    `;

    this.resultsContainer.innerHTML = resultsHTML;
    this.resultsContainer.style.setProperty('display', 'block', 'important');
    this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
}
    
    logout() {
        localStorage.clear();
        window.location.reload();
    }
    
    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type} show`;
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NIMCETRankPredictor();
});

 