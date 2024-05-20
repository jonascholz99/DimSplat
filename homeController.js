
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