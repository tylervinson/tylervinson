// ID: landingScript_v2.7

window.addEventListener('load', function () {
  const cards = document.querySelectorAll('.card');
  const detailPage = document.getElementById('detailPage');
  const detailContent = document.getElementById('detailContent');
  const cardSection = document.getElementById('cardSection');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const themeToggleCheckbox = document.getElementById('themeToggle');
  const siteLogo = document.getElementById('siteLogo');

  // Store original step sections for reset
  const originalSteps = [];
  document.querySelectorAll('.step-section').forEach(step => {
    originalSteps.push(step.cloneNode(true));
  });
  
  // Store the wellness form for reset
  const wellnessForm = document.getElementById('detail-wellness');
  const originalWellnessForm = wellnessForm ? wellnessForm.cloneNode(true) : null;
  
  function setThemeMode(isDark) {
    if (isDark) {
      document.body.classList.add('dark');
      themeToggleCheckbox.checked = true;
      localStorage.setItem('theme', 'dark');
      if (siteLogo) siteLogo.src = 'logo-dark.svg';
    } else {
      document.body.classList.remove('dark');
      themeToggleCheckbox.checked = false;
      localStorage.setItem('theme', 'light');
      if (siteLogo) siteLogo.src = 'logo-light.svg';
    }
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setThemeMode(true);
  } else {
    setThemeMode(false);
  }

  themeToggleCheckbox.addEventListener('change', function () {
    setThemeMode(this.checked);
  });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('show');
    });
  }

  function animateCardsIn() {
    cards.forEach(function (card) {
      card.classList.remove('slide-out', 'show', 'start');
    });

    void document.body.offsetHeight;

    cards.forEach(function (card, index) {
      setTimeout(function () {
        card.classList.add('show');
      }, index * 200);
    });
  }

  function resetWellnessDetail() {
    // Clear the detail content
    detailContent.innerHTML = '';
    
    // First add the wellness form
    if (originalWellnessForm) {
      const clonedForm = originalWellnessForm.cloneNode(true);
      clonedForm.style.display = 'block';
      detailContent.appendChild(clonedForm);
      
      // Add event listener to the form
      setTimeout(() => {
        const formElement = detailContent.querySelector('#wellnessForm');
        if (formElement) {
          formElement.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Hide the form
            const formContainer = formElement.closest('.wellness-interstitial');
            if (formContainer) {
              formContainer.style.display = 'none';
            }
            
            // Show the first step
            showStep(1);
          });
        }
      }, 100);
    }
    
    // Then add the steps (initially hidden)
    originalSteps.forEach(step => {
      const clonedStep = step.cloneNode(true);
      clonedStep.style.display = 'none';
      detailContent.appendChild(clonedStep);
    });
    
    // Update all navigation buttons to use the new goToStep function
    setTimeout(() => {
      updateStepNavigation();
    }, 100);
  }
  
  // Function to update all navigation buttons
  function updateStepNavigation() {
    const steps = detailContent.querySelectorAll('.step-section');
    steps.forEach((step, index) => {
      const stepNumber = index + 1;
      const navButtons = step.querySelectorAll('.nav button');
      
      // Clear any existing event listeners
      navButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      });
      
      // Set up new event listeners
      const navButtons2 = step.querySelectorAll('.nav button');
      if (navButtons2.length > 0) {
        // First button (up arrow)
        if (navButtons2[0]) {
          if (stepNumber === 1) {
            // If it's the first step, go back to the form
            navButtons2[0].onclick = function() { 
              goBackToForm(); 
            };
          } else {
            // Otherwise, go to previous step
            navButtons2[0].onclick = function() { 
              goToStep(stepNumber - 1); 
            };
          }
        }
        
        // Second button (down arrow) if it exists
        if (navButtons2[1]) {
          navButtons2[1].onclick = function() { 
            goToStep(stepNumber + 1); 
          };
        }
      }
    });
  }
  
  // Function to show a specific step
  function showStep(stepNumber) {
    const stepToShow = detailContent.querySelector('#step' + stepNumber);
    if (!stepToShow) return;
    
    // Hide all steps
    detailContent.querySelectorAll('.step-section').forEach(step => {
      step.style.display = 'none';
    });
    
    // Show the requested step
    stepToShow.style.display = 'flex';
    
    // Scroll to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Make sure the tooltip animation plays
    const tooltip = stepToShow.querySelector('.stat-box');
    if (tooltip) {
      tooltip.style.animation = 'none';
      void tooltip.offsetHeight; // Force reflow
      tooltip.style.animation = 'fadeInUp 0.6s ease both';
    }
  }
  
  // Function to go back to the form
  function goBackToForm() {
    // Hide current step
    detailContent.querySelectorAll('.step-section').forEach(step => {
      step.style.display = 'none';
    });
    
    // Show the form
    const formContainer = detailContent.querySelector('.wellness-interstitial');
    if (formContainer) {
      formContainer.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function onCardClick(e) {
    const clickedCard = e.currentTarget;
    const clickedIndex = Array.from(cards).indexOf(clickedCard);
    const title = clickedCard.querySelector('h2').textContent;
    const dataPage = clickedCard.getAttribute('data-page');

    let closeBtn;

    if (title === 'Wellness') {
      // Reset the wellness detail content each time
      resetWellnessDetail();
    } else {
      const detailBlock = document.getElementById('detail-' + dataPage);
      detailContent.innerHTML = detailBlock ? detailBlock.innerHTML : '';
    }

    cards.forEach(function (card, index) {
      const delay = Math.abs(index - clickedIndex) * 150;
      setTimeout(function () {
        card.classList.add('slide-out');
      }, delay);
    });

    const maxDelay = (cards.length - 1) * 150 + 200;
    setTimeout(function () {
      detailPage.classList.add('show');

      closeBtn = document.querySelector('.close-btn');
      if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '&times;';
        detailContent.appendChild(closeBtn);
      }

      closeBtn.addEventListener('click', function () {
        detailPage.classList.remove('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // First, hide all cards (both enabled and disabled)
        cards.forEach(function (card) {
          card.classList.remove('show', 'slide-out');
          card.classList.add('start');
          // Make sure cards are invisible to start with
          card.style.opacity = '0';
        });

        void document.body.offsetHeight;

        // Then animate them back in
        setTimeout(function () {
          cards.forEach(function (card, index) {
            setTimeout(function () {
              card.classList.remove('start');
              card.classList.add('show');
              // Let the CSS animation handle opacity through the 'show' class
              card.style.opacity = '';
            }, index * 200);
          });
        }, 400);
      });
    }, maxDelay);
  }

  cards.forEach(function (card) {
    if (!card.classList.contains('disabled')) {
      card.addEventListener('click', onCardClick);
    }
  });

  animateCardsIn();
  
  // Expose necessary functions globally
  window.goToStep = goToStep;
  window.goBackToForm = goBackToForm;
});

function goToStep(stepNumber) {
  // Fix for first step bubble disappearing
  if (stepNumber < 1) return; // Prevent navigation to invalid steps
  
  const current = document.querySelector('.step-section:not([style*="display: none"])');
  const next = document.getElementById('step' + stepNumber);
  
  if (!next) return;

  const tooltip = current.querySelector('.stat-box');
  tooltip.style.animation = 'fadeOutDown 0.4s ease both';

  setTimeout(function () {
    current.style.display = 'none';
    next.style.display = 'flex';
    
    // Reset animation for next tooltip to make it appear properly
    const nextTooltip = next.querySelector('.stat-box');
    if (nextTooltip) {
      nextTooltip.style.animation = 'none';
      void nextTooltip.offsetHeight; // Force reflow
      nextTooltip.style.animation = 'fadeInUp 0.6s ease both';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 400);
} // End landingScript_v2.7