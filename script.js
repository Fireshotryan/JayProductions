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

const projectGrid = document.querySelector('[data-project-grid]');

if (projectGrid) {
	const projectCards = Array.from(projectGrid.querySelectorAll('.work-card'));
	const tagButtons = Array.from(document.querySelectorAll('.filter-chip[data-tag]'));
	const sortButtons = Array.from(document.querySelectorAll('.sort-button[data-sort]'));
	const emptyState = document.querySelector('[data-project-empty]');
	const filterNote = document.querySelector('[data-project-filter-note]');
	const selectedTags = new Set();
	let sortOrder = 'desc';
	let collapsedAllTags = false;

	function getCardTags(card) {
		return String(card.dataset.tags || '')
			.split(/\s+/)
			.filter(Boolean);
	}

	function getAvailableTags() {
		return tagButtons
			.map((button) => button.dataset.tag)
			.filter((tag) => tag && tag !== 'all');
	}

	function updatePressedStates() {
		tagButtons.forEach((button) => {
			const tag = button.dataset.tag;
			button.setAttribute('aria-pressed', tag === 'all' ? String(selectedTags.size === 0) : String(selectedTags.has(tag)));
		});

		sortButtons.forEach((button) => {
			button.setAttribute('aria-pressed', String(button.dataset.sort === sortOrder));
		});
	}

	function renderProjects() {
		const sortedCards = [...projectCards].sort((a, b) => {
			const yearA = Number(a.dataset.year || 0);
			const yearB = Number(b.dataset.year || 0);
			const yearDifference = sortOrder === 'desc' ? yearB - yearA : yearA - yearB;

			if (yearDifference !== 0) {
				return yearDifference;
			}

			return String(a.dataset.title || '').localeCompare(String(b.dataset.title || ''), 'nl');
		});

		let visibleCount = 0;

		sortedCards.forEach((card) => {
			const tags = getCardTags(card);
			const isVisible = selectedTags.size === 0 || [...selectedTags].some((tag) => tags.includes(tag));

			card.classList.toggle('is-hidden', !isVisible);
			projectGrid.appendChild(card);

			if (isVisible) {
				visibleCount += 1;
			}
		});

		if (emptyState) {
			emptyState.hidden = visibleCount > 0;
		}

		if (filterNote) {
			filterNote.hidden = !collapsedAllTags;
		}

		updatePressedStates();
	}

	tagButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const tag = button.dataset.tag;

			if (tag === 'all') {
				selectedTags.clear();
				collapsedAllTags = false;
			} else if (selectedTags.has(tag)) {
				selectedTags.delete(tag);
				collapsedAllTags = false;
			} else {
				selectedTags.add(tag);
				const availableTags = getAvailableTags();

				if (selectedTags.size === availableTags.length) {
					selectedTags.clear();
					collapsedAllTags = true;
				} else {
					collapsedAllTags = false;
				}
			}

			renderProjects();
		});
	});

	sortButtons.forEach((button) => {
		button.addEventListener('click', () => {
			sortOrder = button.dataset.sort || 'desc';
			renderProjects();
		});
	});

	renderProjects();
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
