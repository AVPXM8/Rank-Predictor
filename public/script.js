class NIMCETRankPredictor {
    constructor() {
        this.currentStep = 'phone';
        this.userToken = localStorage.getItem('nimcetToken');
        this.userPhone = localStorage.getItem('nimcetPhone');
        this.userName = localStorage.getItem('nimcetName');
        this.allColleges = [];
        this.filteredColleges = [];
        this.currentUser = null; // For AI chat
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkExistingSession();
    }
    
    initializeElements() {
        // Steps
        this.phoneStep = document.getElementById('phoneStep');
        this.otpStep = document.getElementById('otpStep');
        this.predictionStep = document.getElementById('predictionStep');
        
        // Phone verification elements
        this.phoneInput = document.getElementById('phoneNumber');
        this.sendOtpBtn = document.getElementById('sendOtpBtn');
        
        // OTP verification elements
        this.otpInput = document.getElementById('otpInput');
        this.verifyOtpBtn = document.getElementById('verifyOtpBtn');
        this.resendOtpBtn = document.getElementById('resendOtpBtn');
        this.displayPhone = document.getElementById('displayPhone');
        this.otpDebug = document.getElementById('otpDebug');
        this.fullNameInput = document.getElementById('fullName');
        this.nameInputContainer = document.getElementById('nameInputContainer');
        
        // Prediction elements
        this.marksInput = document.getElementById('marksInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.predictBtn = document.getElementById('predictBtn');
        this.verifiedPhone = document.getElementById('verifiedPhone');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.percentageDisplay = document.getElementById('percentageDisplay');
        
        // User info elements - WITH NULL CHECKS
        this.userInfo = document.getElementById('userInfo');
        this.userFullName = document.getElementById('userFullName');
        this.avatar = document.getElementById('avatar');
        this.memberSince = document.getElementById('memberSince');
        
        // Results elements
        this.resultsContainer = document.getElementById('resultsContainer');
        this.rankRange = document.getElementById('rankRange');
        this.rankMessage = document.getElementById('rankMessage');
        this.resultMarks = document.getElementById('resultMarks');
        this.resultPercentage = document.getElementById('resultPercentage');
        this.resultCategory = document.getElementById('resultCategory');
        
        // College elements
        this.collegesCount = document.getElementById('collegesCount');
        this.collegesList = document.getElementById('collegesList');
        this.tierFilter = document.getElementById('tierFilter');
        this.chanceFilter = document.getElementById('chanceFilter');
        
        // Loading and toast
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toast = document.getElementById('toast');
        
        // AI Chat elements (will be created dynamically)
        this.aiChatSection = document.getElementById('aiChatSection');
        
        // DEBUG: Log missing elements
        console.log('DOM Elements Check:', {
            verifiedPhone: !!this.verifiedPhone,
            userFullName: !!this.userFullName,
            avatar: !!this.avatar,
            memberSince: !!this.memberSince
        });
    }
    
    attachEventListeners() {
        // Phone verification
        this.sendOtpBtn.addEventListener('click', () => this.sendOTP());
        this.phoneInput.addEventListener('input', () => this.validatePhone());
        this.phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendOTP();
        });
        
        // OTP verification
        this.verifyOtpBtn.addEventListener('click', () => this.verifyOTP());
        this.resendOtpBtn.addEventListener('click', () => this.resendOTP());
        this.otpInput.addEventListener('input', () => this.validateOTP());
        this.otpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyOTP();
        });
        this.fullNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyOTP();
        });
        
        // Prediction
        this.predictBtn.addEventListener('click', () => this.predictRank());
        this.marksInput.addEventListener('input', () => this.updatePercentage());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // College filters
        this.tierFilter.addEventListener('change', () => this.filterColleges());
        this.chanceFilter.addEventListener('change', () => this.filterColleges());
        
        // Enter key support for marks input
        this.marksInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.predictRank();
        });
    }
    
    checkExistingSession() {
        if (this.userToken && this.userPhone) {
            this.showStep('prediction');
            if (this.verifiedPhone) this.verifiedPhone.textContent = this.userPhone;
            if (this.userFullName) this.userFullName.textContent = this.userName || 'User';
            if (this.avatar) this.avatar.textContent = this.userName ? this.userName.charAt(0) : 'U';
            if (this.memberSince) this.memberSince.textContent = localStorage.getItem('nimcetMemberSince') || 'Today';
            
            // Set current user for AI
            this.currentUser = {
                userId: localStorage.getItem('nimcetUserId'),
                fullName: this.userName,
                phoneNumber: this.userPhone
            };
        }
    }
    
    showStep(step) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById(`${step}Step`).classList.add('active');
        this.currentStep = step;
        
        // 🆕 NEW: Check prediction limit when showing prediction step
        if (step === 'prediction') {
            setTimeout(() => this.checkPredictionLimit(), 500);
        }
    }
    
    // 🆕 NEW: Check prediction limit
    async checkPredictionLimit() {
        try {
            const token = localStorage.getItem('nimcetToken');
            if (!token) return;
            
            const response = await fetch(`/api/user/prediction-limit?token=${token}`);
            const data = await response.json();
            
            if (data.success) {
                this.updatePredictionLimitUI(data.usageInfo);
            }
        } catch (error) {
            console.error('Failed to check prediction limit:', error);
        }
    }

    // 🆕 NEW: Update UI to show prediction limits
    updatePredictionLimitUI(usageInfo) {
        // Create or update limit display
        let limitDisplay = document.getElementById('predictionLimitDisplay');
        if (!limitDisplay) {
            limitDisplay = document.createElement('div');
            limitDisplay.id = 'predictionLimitDisplay';
            limitDisplay.className = 'prediction-limit-display';
            
            // Insert before the prediction form
            const predictionStep = document.getElementById('predictionStep');
            if (predictionStep) {
                const firstChild = predictionStep.querySelector('.step-content');
                if (firstChild) {
                    firstChild.insertBefore(limitDisplay, firstChild.firstChild);
                }
            }
        }
        
        const remainingCount = usageInfo.predictionsRemaining;
        const usedCount = usageInfo.predictionsUsed;
        const totalCount = usageInfo.totalAllowed;
        
        if (remainingCount > 0) {
            limitDisplay.innerHTML = `
                <div class="limit-info success">
                    <div class="limit-header">
                        <span class="limit-icon">📊</span>
                        <span class="limit-title">Predictions Available</span>
                    </div>
                    <div class="limit-details">
                        <div class="limit-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(usedCount/totalCount)*100}%"></div>
                            </div>
                            <span class="progress-text">${usedCount}/${totalCount} used</span>
                        </div>
                        <div class="remaining-count">
                            <strong>${remainingCount} predictions remaining</strong> for ${usageInfo.phoneNumber}
                        </div>
                    </div>
                </div>
            `;
        } else {
            limitDisplay.innerHTML = `
                <div class="limit-info warning">
                    <div class="limit-header">
                        <span class="limit-icon">⚠️</span>
                        <span class="limit-title">Prediction Limit Reached</span>
                    </div>
                    <div class="limit-details">
                        <p>You have used all <strong>${totalCount} predictions</strong> for ${usageInfo.phoneNumber}</p>
                        <p>To get more predictions, please use a different phone number.</p>
                        <button onclick="app.logout()" class="switch-number-btn">
                            Use Different Number
                        </button>
                    </div>
                </div>
            `;
            
            // Disable prediction form
            if (this.predictBtn) this.predictBtn.disabled = true;
            if (this.marksInput) this.marksInput.disabled = true;
            if (this.categorySelect) this.categorySelect.disabled = true;
        }
    }
    
    validatePhone() {
        const phone = this.phoneInput.value.replace(/\D/g, '');
        this.phoneInput.value = phone;
        this.sendOtpBtn.disabled = phone.length !== 10;
    }
    
    validateOTP() {
        const otp = this.otpInput.value.replace(/\D/g, '');
        this.otpInput.value = otp;
        this.verifyOtpBtn.disabled = otp.length !== 6;
    }
    
    updatePercentage() {
        const marks = parseInt(this.marksInput.value) || 0;
        const percentage = ((marks / 1000) * 100).toFixed(2);
        this.percentageDisplay.textContent = marks > 0 ? `${percentage}%` : '';
        this.predictBtn.disabled = marks <= 0 || marks > 1000;
    }
    
    async sendOTP() {
        const phoneNumber = this.phoneInput.value.trim();
        
        if (phoneNumber.length !== 10) {
            this.showToast('Please enter a valid 10-digit phone number', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayPhone.textContent = phoneNumber;
                if (data.debug) {
                    this.otpDebug.innerHTML = `<strong>Debug OTP:</strong> ${data.debug}`;
                }
                
                // Show name field if required
                if (data.requiresName) {
                    this.nameInputContainer.style.display = 'block';
                    this.fullNameInput.focus();
                } else {
                    this.nameInputContainer.style.display = 'none';
                }
                
                this.showStep('otp');
                this.showToast('OTP sent successfully!', 'success');
                this.otpInput.focus();
                        } else {
                this.showToast(data.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
        
        this.showLoading(false);
    }
    
    async verifyOTP() {
        const phoneNumber = this.displayPhone.textContent;
        const otp = this.otpInput.value.trim();
        const fullName = this.fullNameInput.value.trim();
        
        if (otp.length !== 6) {
            this.showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const requestBody = {
                phoneNumber: phoneNumber,
                otp: otp
            };
            
            // Only include fullName if it's provided
            if (fullName && fullName.length >= 2) {
                requestBody.fullName = fullName;
            }
            
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Store user data
                this.userToken = data.token;
                this.userPhone = phoneNumber;
                this.userName = data.user.fullName;
                
                // Save to localStorage
                localStorage.setItem('nimcetToken', this.userToken);
                localStorage.setItem('nimcetPhone', this.userPhone);
                localStorage.setItem('nimcetName', this.userName);
                localStorage.setItem('nimcetMemberSince', data.user.memberSince);
                localStorage.setItem('nimcetUserId', data.userId);
                
                // Set current user
                this.currentUser = {
                    userId: data.userId,
                    fullName: this.userName,
                    phoneNumber: this.userPhone
                };
                
                // SAFE DOM UPDATES - Check if elements exist
                if (this.verifiedPhone) {
                    this.verifiedPhone.textContent = this.userPhone;
                }
                
                if (this.userFullName) {
                    this.userFullName.textContent = this.userName;
                }
                
                if (this.avatar) {
                    this.avatar.textContent = this.userName.charAt(0).toUpperCase();
                }
                
                if (this.memberSince) {
                    try {
                        this.memberSince.textContent = new Date(data.user.memberSince).toLocaleDateString();
                    } catch (e) {
                        this.memberSince.textContent = 'Today';
                    }
                }
                
                // Show prediction step
                this.showStep('prediction');
                this.showToast(`Welcome ${this.userName}!`, 'success');
                
                // Focus on marks input if it exists
                if (this.marksInput) {
                    setTimeout(() => this.marksInput.focus(), 100);
                }
                
            } else if (data.requiresName) {
                if (this.nameInputContainer) {
                    this.nameInputContainer.style.display = 'block';
                }
                if (this.fullNameInput) {
                    this.fullNameInput.focus();
                }
                this.showToast('Please enter your full name', 'warning');
            } else {
                this.showToast(data.message || 'Invalid OTP. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Verify OTP Error:', error);
            this.showToast('Verification failed. Please try again.', 'error');
        }
        
        this.showLoading(false);
    }
    
    async resendOTP() {
        const phoneNumber = this.displayPhone.textContent;
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.debug) {
                    this.otpDebug.innerHTML = `<strong>Debug OTP:</strong> ${data.debug}`;
                }
                this.showToast('OTP resent successfully!', 'success');
                this.otpInput.value = '';
                this.otpInput.focus();
            } else {
                this.showToast(data.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
        
        this.showLoading(false);
    }

    async makeAPICall(url, data, method = 'POST') {
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: method !== 'GET' ? JSON.stringify(data) : undefined
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error (${response.status}):`, errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network connection failed. Please check your internet.');
            }
            throw error;
        }
    }
    
    // 🆕 UPDATED: Predict rank with limit handling
    async predictRank() {
        const marks = parseInt(this.marksInput.value);
        const category = this.categorySelect.value;
        
        if (!marks || marks <= 0 || marks > 1000) {
            this.showToast('Please enter valid marks between 1 and 1000', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/predict-rank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marks, category, token: this.userToken })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data.prediction);
                this.showToast('Rank predicted successfully!', 'success');
                
                // 🆕 NEW: Update limit display after successful prediction
                if (data.usageInfo) {
                    this.updatePredictionLimitUI(data.usageInfo);
                }
            } else {
                // 🆕 NEW: Handle limit reached error
                if (data.errorType === 'LIMIT_REACHED') {
                    this.showToast(data.message, 'warning');
                    
                    // Show limit reached UI
                    this.updatePredictionLimitUI({
                        predictionsUsed: data.details.predictionsUsed,
                        predictionsRemaining: 0,
                        totalAllowed: data.details.predictionsAllowed,
                        phoneNumber: data.details.phoneNumber,
                        canPredict: false
                    });
                    
                    // Show detailed limit message
                    this.showLimitReachedMessage(data.details);
                    return;
                }
                
                this.showToast(data.message || 'Unable to predict rank for these marks', 'warning');
                this.resultsContainer.style.display = 'none';
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
        
        this.showLoading(false);
    }

    // 🆕 NEW: Show limit reached message
    showLimitReachedMessage(details) {
        // Create or update results container to show limit message
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = `
                <div class="limit-reached-container">
                    <div class="limit-reached-icon">🚫</div>
                    <h3>Prediction Limit Reached!</h3>
                    <p>You have used all <strong>${details.predictionsAllowed} predictions</strong> for this phone number.</p>
                    <div class="limit-actions">
                        <button onclick="app.logout()" class="primary-btn">
                            Use Different Number
                        </button>
                        <button onclick="app.showAllColleges()" class="secondary-btn">
                            View All Colleges
                        </button>
                    </div>
                    <div class="limit-suggestion">
                        <p><strong>💡 Suggestion:</strong> ${details.suggestion}</p>
                    </div>
                </div>
            `;
            this.resultsContainer.style.display = 'block';
            this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // 🆕 NEW: Show all colleges without prediction
    showAllColleges() {
        // You can implement this to show all colleges regardless of rank
        this.showToast('Contact admin for complete college list', 'info');
    }
    
    displayResults(prediction) {
        // Display rank results
        this.rankRange.textContent = `${prediction.rankRange.min.toLocaleString()} - ${prediction.rankRange.max.toLocaleString()}`;
       // this.rankMessage.textContent = prediction.message;
       this.rankMessage.textContent = `Your Predicted ${prediction.category} Rank`;
        this.resultMarks.textContent = `${prediction.marks}/1000`;
        this.resultPercentage.textContent = `${prediction.additionalInfo.percentage}%`;
        this.resultCategory.textContent = prediction.category;
        
        // Store colleges data
        this.allColleges = prediction.colleges || [];
        this.filteredColleges = [...this.allColleges];
        
        // Display colleges
        this.displayColleges();
        
        // Show results
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    // adding new function to avoid duplicasy
    displayColleges() {
    this.collegesCount.textContent = `${this.filteredColleges.length} colleges found`;
    
    if (this.filteredColleges.length === 0) {
        this.collegesList.innerHTML = `
            <div class="no-colleges">
                <i class="fas fa-university"></i>
                <h4>No colleges match your filters</h4>
                <p>Try adjusting your filter criteria</p>
            </div>
        `;
        return;
    }
    
    this.collegesList.innerHTML = this.filteredColleges.map(college => `
        <div class="college-card fade-in">
            <div class="tier-badge tier-${college.tier}">Tier ${college.tier}</div>
            
            <div class="college-main">
                <div class="college-info">
                    <h4>${college.name}</h4>
                    <div class="college-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${college.location}
                    </div>
                    <span class="college-type ${college.type === 'NIT' ? 'nit' : 'private'}">${college.type}</span>
                </div>
                
                <div class="chance-indicator">
                    <span class="chance-badge ${this.getChanceClass(college.chance)}">
                        ${this.getChanceText(college.chance)}
                    </span>
                    <span class="chance-percentage">${college.chance}% chance</span>
                </div>
            </div>
            
            <div class="cutoff-info">
                <span class="user-rank">Your Rank: ${college.userRank}</span>
                <span class="college-cutoff">College Cutoff: ${college.cutoffRange}</span>
            </div>
            
            </div>
    `).join('');
    
    // Add fade-in animation
    setTimeout(() => {
        document.querySelectorAll('.college-card').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
            }, index * 100);
        });
    }, 100);
}
    
    // displayColleges() {
    //     this.collegesCount.textContent = `${this.filteredColleges.length} colleges found`;
        
    //     if (this.filteredColleges.length === 0) {
    //         this.collegesList.innerHTML = `
    //             <div class="no-colleges">
    //                 <i class="fas fa-university"></i>
    //                 <h4>No colleges match your filters</h4>
    //                 <p>Try adjusting your filter criteria</p>
    //             </div>
    //         `;
    //         return;
    //     }
        
    //     this.collegesList.innerHTML = this.filteredColleges.map(college => `
    //         <div class="college-card fade-in">
    //             <div class="tier-badge tier-${college.tier}">Tier ${college.tier}</div>
                
    //             <div class="college-main">
    //                 <div class="college-info">
    //                     <h4>${college.name}</h4>
    //                     <div class="college-location">
    //                         <i class="fas fa-map-marker-alt"></i>
    //                         ${college.location}
    //                     </div>
    //                     <span class="college-type ${college.type === 'NIT' ? 'nit' : 'private'}">${college.type}</span>
    //                 </div>
                    
    //                 <div class="chance-indicator">
    //                     <span class="chance-badge ${this.getChanceClass(college.chance)}">
    //                         ${this.getChanceText(college.chance)}
    //                     </span>
    //                     <span class="chance-percentage">${college.chance}% chance</span>
    //                 </div>
    //             </div>
                
    //             <div class="cutoff-info">
    //                 <span class="user-rank">Your Rank: ${college.userRank}</span>
    //                 <span class="college-cutoff">College Cutoff: ${college.cutoffRange}</span>
    //             </div>
                
    //             <div class="college-details">
    //                 <div class="detail-box">
    //                     <span class="label">Fees</span>
    //                     <span class="value">${college.fees}</span>
    //                 </div>
    //                 <div class="detail-box">
    //                     <span class="label">Duration</span>
    //                     <span class="value">${college.duration}</span>
    //                 </div>
    //                 <div class="detail-box">
    //                     <span class="label">Seats</span>
    //                     <span class="value">${college.seats}</span>
    //                 </div>
    //             </div>
                
    //             <div class="college-highlights">
    //                 ${college.highlights.map(highlight => `
    //                     <span class="highlight-tag">${highlight}</span>
    //                 `).join('')}
    //             </div>
    //         </div>
    //     `).join('');
        
    //     // Add fade-in animation
    //     setTimeout(() => {
    //         document.querySelectorAll('.college-card').forEach((card, index) => {
    //             setTimeout(() => {
    //                 card.style.opacity = '1';
    //             }, index * 100);
    //         });
    //     }, 100);
    // }
    
    getChanceClass(chance) {
        if (chance >= 75) return 'chance-high';
        if (chance >= 50) return 'chance-moderate';
        return 'chance-low';
    }
        getChanceText(chance) {
        if (chance >= 75) return 'High Chance';
        if (chance >= 50) return 'Moderate Chance';
        return 'Low Chance';
    }
    
    filterColleges() {
        const tierFilter = this.tierFilter.value;
        const chanceFilter = this.chanceFilter.value;
        
        this.filteredColleges = this.allColleges.filter(college => {
            // Tier filter
            if (tierFilter !== 'all' && college.tier.toString() !== tierFilter) {
                return false;
            }
            
            // Chance filter
            if (chanceFilter !== 'all') {
                if (chanceFilter === 'high' && college.chance < 75) return false;
                if (chanceFilter === 'moderate' && (college.chance < 50 || college.chance >= 75)) return false;
                if (chanceFilter === 'low' && college.chance >= 50) return false;
            }
            
            return true;
        });
        
        this.displayColleges();
    }
    
    // 🆕 UPDATED: Logout with prediction limit reset
    logout() {
        localStorage.removeItem('nimcetToken');
        localStorage.removeItem('nimcetPhone');
        localStorage.removeItem('nimcetName');
        localStorage.removeItem('nimcetMemberSince');
        localStorage.removeItem('nimcetUserId');
        this.userToken = null;
        this.userPhone = null;
        this.userName = null;
        this.currentUser = null;
        
        // Reset form
        this.phoneInput.value = '';
        this.otpInput.value = '';
        this.fullNameInput.value = '';
        this.marksInput.value = '';
        this.categorySelect.value = 'General';
        this.resultsContainer.style.display = 'none';
        this.tierFilter.value = 'all';
        this.chanceFilter.value = 'all';
        this.nameInputContainer.style.display = 'none';
        
        // 🆕 NEW: Reset prediction limit display
        const limitDisplay = document.getElementById('predictionLimitDisplay');
        if (limitDisplay) {
            limitDisplay.remove();
        }
        
        // Re-enable form elements
        if (this.predictBtn) this.predictBtn.disabled = false;
        if (this.marksInput) this.marksInput.disabled = false;
        if (this.categorySelect) this.categorySelect.disabled = false;
        
        // Clear colleges data
        this.allColleges = [];
        this.filteredColleges = [];
        
        this.showStep('phone');
        this.showToast('Logged out successfully', 'success');
    }
    
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('show');
        } else {
            this.loadingOverlay.classList.remove('show');
        }
    }
    
    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Global app instance for button onclick handlers
let app;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new NIMCETRankPredictor();
});