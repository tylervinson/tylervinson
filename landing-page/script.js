// ID: landingSlideTransition_v1.1

window.addEventListener('load', function () {
  var cards = document.querySelectorAll('.card');
  var detailPage = document.getElementById('detailPage');
  var detailContent = document.getElementById('detailContent');
  var cardSection = document.getElementById('cardSection');

  var pageData = {
    experience: `
      <button class="back-btn">← Back</button>
      <h2>Personalized Experiences</h2>
      <p>Detailed content about personalized dashboards, storytelling with data, and user-centric insights.</p>
    `,
    insights: `
      <button class="back-btn">← Back</button>
      <h2>Visual Insights</h2>
      <p>Learn how real-time dashboards empower your team across devices and platforms with analytics.</p>
    `,
    decisions: `
      <button class="back-btn">← Back</button>
      <h2>Smart Decisions</h2>
      <p>Discover how data translates into action — and how to drive measurable results through insights.</p>
    `
  };

  // Animate in cards
  cards.forEach(function (card, index) {
    setTimeout(function () {
      card.classList.add('show');
    }, index * 200);
  });

  // Handle click and animation out
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var page = this.getAttribute('data-page');
console.log('Clicked card:', page);


      // Animate each card out with delay
      cards.forEach(function (c, i) {
        setTimeout(function () {
          c.classList.add('slide-out');
        }, i * 150);
      });

      // Show detail after all cards animate out
      setTimeout(function () {
        cardSection.classList.add('slide-left');
        detailPage.classList.add('show');
        detailContent.innerHTML = pageData[page];

        // Back button handler
        setTimeout(function () {
          document.querySelector('.back-btn').addEventListener('click', function () {
            detailPage.classList.remove('show');
            cardSection.classList.remove('slide-left');

            setTimeout(function () {
              cards.forEach(function (c) {
                c.classList.remove('slide-out');
              });
            }, 300);
          });
        }, 50);
      }, cards.length * 150 + 200);
    });
  });
});
