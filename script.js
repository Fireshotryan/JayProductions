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

const youtubeFrames = document.querySelectorAll('iframe[src*="youtube-nocookie.com/embed"]');

if (youtubeFrames.length) {
	let youtubeApiPromise;

	function loadYouTubeApi() {
		if (window.YT && window.YT.Player) {
			return Promise.resolve(window.YT);
		}

		if (youtubeApiPromise) {
			return youtubeApiPromise;
		}

		youtubeApiPromise = new Promise((resolve) => {
			const previousReady = window.onYouTubeIframeAPIReady;

			window.onYouTubeIframeAPIReady = () => {
				if (typeof previousReady === 'function') {
					previousReady();
				}

				resolve(window.YT);
			};

			const script = document.createElement('script');
			script.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild(script);
		});

		return youtubeApiPromise;
	}

	function addUrlParams(url, params) {
		const [base, queryString = ''] = url.split('?');
		const searchParams = new URLSearchParams(queryString);

		Object.entries(params).forEach(([key, value]) => {
			searchParams.set(key, value);
		});

		return `${base}?${searchParams.toString()}`;
	}

	youtubeFrames.forEach((iframe, index) => {
		const frameShell = iframe.closest('.project-video, .featured-video, .video-frame');

		if (!frameShell) {
			return;
		}

		let player;
		let isStarted = false;
		let pendingPlay = false;
		const iframeId = iframe.id || `youtube-player-${index + 1}`;

		iframe.id = iframeId;
		iframe.src = addUrlParams(iframe.getAttribute('src') || '', {
			rel: '0',
			modestbranding: '1',
			playsinline: '1',
			controls: '0',
			disablekb: '1',
			fs: '0',
			enablejsapi: '1'
		});

		const playOverlay = document.createElement('button');
		playOverlay.className = 'video-privacy-overlay';
		playOverlay.type = 'button';
		playOverlay.setAttribute('aria-label', 'Video afspelen');
		playOverlay.innerHTML = '<span>Bekijk video</span>';

		const controls = document.createElement('div');
		controls.className = 'video-custom-controls';
		controls.innerHTML = `
			<button class="video-control" type="button" data-action="play" aria-label="Video afspelen">Afspelen</button>
			<button class="video-control" type="button" data-action="mute" aria-label="Geluid uitzetten">Geluid uit</button>
			<button class="video-control" type="button" data-action="fullscreen" aria-label="Video fullscreen tonen">Fullscreen</button>
		`;

		const playButton = controls.querySelector('[data-action="play"]');
		const muteButton = controls.querySelector('[data-action="mute"]');
		const fullscreenButton = controls.querySelector('[data-action="fullscreen"]');

		function setPlayingState(isPlaying) {
			frameShell.classList.toggle('is-playing', isPlaying || isStarted);

			if (playButton) {
				playButton.textContent = isPlaying ? 'Pauzeren' : 'Afspelen';
				playButton.setAttribute('aria-label', isPlaying ? 'Video pauzeren' : 'Video afspelen');
			}
		}

		function playVideo() {
			isStarted = true;
			frameShell.classList.add('is-playing');

			if (player && typeof player.playVideo === 'function') {
				player.playVideo();
				return;
			}

			pendingPlay = true;
		}

		function togglePlay() {
			if (!isStarted) {
				playVideo();
				return;
			}

			if (!player || typeof player.getPlayerState !== 'function') {
				return;
			}

			if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
				player.pauseVideo();
			} else {
				player.playVideo();
			}
		}

		function toggleMute() {
			if (!player || typeof player.isMuted !== 'function') {
				return;
			}

			if (player.isMuted()) {
				player.unMute();
				muteButton.textContent = 'Geluid uit';
				muteButton.setAttribute('aria-label', 'Geluid uitzetten');
			} else {
				player.mute();
				muteButton.textContent = 'Geluid aan';
				muteButton.setAttribute('aria-label', 'Geluid aanzetten');
			}
		}

		function openFullscreen() {
			const fullscreenTarget = frameShell.closest('.visual-card, .video-card, .featured-video-shell') || frameShell;

			if (fullscreenTarget.requestFullscreen) {
				fullscreenTarget.requestFullscreen();
			}
		}

		frameShell.classList.add('video-privacy-shell');
		frameShell.append(playOverlay, controls);
		frameShell.addEventListener('contextmenu', (event) => event.preventDefault());

		playOverlay.addEventListener('click', togglePlay);
		playOverlay.addEventListener('contextmenu', (event) => event.preventDefault());
		playButton.addEventListener('click', togglePlay);
		muteButton.addEventListener('click', toggleMute);
		fullscreenButton.addEventListener('click', openFullscreen);

		loadYouTubeApi().then((YT) => {
			player = new YT.Player(iframeId, {
				events: {
					onReady: () => {
						if (pendingPlay) {
							pendingPlay = false;
							playVideo();
						}
					},
					onStateChange: (event) => {
						setPlayingState(event.data === YT.PlayerState.PLAYING);
					}
				}
			});
		});
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
