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

		/* Lightbox: open gallery images in modal on click */
		(() => {
			const galleryImgs = document.querySelectorAll('.project-gallery .gallery-item img');
			const lightbox = document.getElementById('lightbox');
			const lightboxImg = lightbox && lightbox.querySelector('.lightbox-img');
			const closeBtn = lightbox && lightbox.querySelector('.lightbox-close');

			if (!galleryImgs.length || !lightbox || !lightboxImg) return;

			function open(src, alt) {
				lightboxImg.src = src;
				lightboxImg.alt = alt || '';
				lightbox.classList.add('is-open');
				lightbox.setAttribute('aria-hidden', 'false');
				document.body.style.overflow = 'hidden';
			}

			function close() {
				lightbox.classList.remove('is-open');
				lightbox.setAttribute('aria-hidden', 'true');
				lightboxImg.src = '';
				document.body.style.overflow = '';
			}

			galleryImgs.forEach((img) => {
				img.style.cursor = 'zoom-in';
				img.addEventListener('click', () => open(img.src, img.alt));
			});

			lightbox.addEventListener('click', (e) => {
				if (e.target === lightbox || e.target === closeBtn) close();
			});

			document.addEventListener('keydown', (e) => {
				if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
			});
		})();
