const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		});
	},
	{ threshold: 0.15 }
);

revealElements.forEach((element) => observer.observe(element));

const footerNote = document.querySelector('.footer span');

if (footerNote) {
	footerNote.textContent = `JayProductions · ${new Date().getFullYear()}`;
}

const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('.form-status');

if (contactForm && formStatus) {
	contactForm.addEventListener('submit', (event) => {
		event.preventDefault();

		const formData = new FormData(contactForm);
		const name = String(formData.get('name') || '').trim();
		const email = String(formData.get('email') || '').trim();
		const project = String(formData.get('project') || '').trim();
		const message = String(formData.get('message') || '').trim();

		const subject = encodeURIComponent(`Projectaanvraag van ${name}`);
		const body = encodeURIComponent(
			`Naam: ${name}\nE-mail: ${email}\nProjecttype: ${project}\n\nBericht:\n${message}`
		);

		formStatus.textContent = 'Je mailapp wordt geopend met een ingevuld bericht.';
		window.location.href = `mailto:hello@jayproductions.nl?subject=${subject}&body=${body}`;
	});
}
