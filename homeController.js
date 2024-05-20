
// Set the background image for the hero section
const heroSection = document.querySelector('.hero-section');
heroSection.style.backgroundImage = "url('./IntroScreen.jpg')";

const logos = document.querySelector('.logos');

window.setTimeout(() => {
    logos.classList.add('show');
}, 100); // Logos nach 3 Sekunden einblenden

window.addEventListener('scroll', function() {
    if (window.scrollY > 0) {
        logos.classList.remove('show');
    } else {
        logos.classList.add('show');
    }
});