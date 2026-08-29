document.querySelectorAll('.project-quote').forEach((quote) => {
  quote.innerHTML = quote.textContent.trim().split(/\s+/).map((word) => `<span class="word">${word}</span>`).join(' ');
});
