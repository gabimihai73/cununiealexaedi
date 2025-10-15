
/* script.js — galerie + upload Cloudinary (unsigned) */
/* CONFIG — pune aici valorile furnizate */
const cloudName = "e816c7ab-17da-4dad-860e-10fdca321dac"; // PID furnizat
const unsignedUploadPreset = "CununieAlexaEdi"; // upload preset furnizat

/* galerie initiala (daca adaugi poze manual in repo, pune URL-urile aici) */
const galleries = {
  "alexa": [
    // Exemplu static local:
    // {url: "alexa-edi/poza1.jpg", name: "poza1.jpg"}
  ],
  "familie": [
    // Exemplu static local:
    // {url: "familie-invitati/pozaA.jpg", name: "pozaA.jpg"}
  ]
};

/* incarca imagini din localStorage (upload-urile din aceasta sesiune) */
function loadSessionUploads() {
  try {
    const sess = JSON.parse(localStorage.getItem('cununie_uploads') || '{}');
    if (sess.alexa) galleries.alexa.push(...sess.alexa);
    if (sess.familie) galleries.familie.push(...sess.familie);
  } catch(e){
    console.warn('Storage parse error', e);
  }
}

loadSessionUploads();

/* UI bindings */
const modal = document.getElementById('galleryModal');
const imagesGrid = document.getElementById('imagesGrid');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', e => {
    const galleryKey = card.getAttribute('data-gallery');
    openGallery(galleryKey);
  });
});

closeModal.addEventListener('click', () => modal.classList.add('hidden'));

/* open gallery in modal */
function openGallery(key) {
  modalTitle.textContent = key === 'alexa' ? 'Alexa & Edi' : 'Familie & invitați';
  imagesGrid.innerHTML = '';
  const list = galleries[key] || [];
  if (!list.length) {
    imagesGrid.innerHTML = '<p style="padding:12px;color:#6e5840">Galeria este goală. Poți încărca poze la secțiunea de upload sau adăuga manual imagini în repo.</p>';
  } else {
    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'image-card';
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = item.name || '';
      const a = document.createElement('a');
      a.className = 'dl-btn';
      a.href = item.url;
      a.download = item.name || '';
      a.textContent = 'Descarcă';
      card.appendChild(img);
      card.appendChild(a);
      imagesGrid.appendChild(card);
    });
  }
  modal.classList.remove('hidden');
}

/* Upload handling */
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const targetSelect = document.getElementById('targetGallery');

uploadBtn.addEventListener('click', async () => {
  const files = fileInput.files;
  if (!files || files.length === 0) {
    uploadStatus.textContent = 'Alege fișiere înainte de upload.';
    return;
  }
  uploadStatus.textContent = 'Încarc...';
  uploadBtn.disabled = true;
  const uploadedThisSession = { alexa: [], familie: [] };
  for (const f of files) {
    try {
      const form = new FormData();
      form.append('file', f);
      form.append('upload_preset', unsignedUploadPreset);
      // optional: tagăm uploadul cu folder info
      const target = targetSelect.value;
      form.append('tags', target);
      // send
      const res = await fetch('https://api.cloudinary.com/v1_1/' + cloudName + '/upload', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (data && data.secure_url) {
        const item = { url: data.secure_url, name: data.original_filename + (data.format ? ('.' + data.format) : '') };
        galleries[target].push(item);
        uploadedThisSession[target].push(item);
        uploadStatus.textContent = 'Încărcat: ' + item.name;
      } else {
        console.error('Upload error', data);
        uploadStatus.textContent = 'Eroare la încărcare: ' + (data.error && data.error.message ? data.error.message : 'necunoscut');
      }
    } catch(err) {
      console.error('Fetch/upload error', err);
      uploadStatus.textContent = 'Eroare la upload: ' + (err.message || err);
    }
  }
  // salveaza in localStorage pentru a persista in browser (nu e un backup pe server)
  try {
    const existing = JSON.parse(localStorage.getItem('cununie_uploads') || '{}');
    existing.alexa = (existing.alexa || []).concat(uploadedThisSession.alexa);
    existing.familie = (existing.familie || []).concat(uploadedThisSession.familie);
    localStorage.setItem('cununie_uploads', JSON.stringify(existing));
  } catch(e) { console.warn('storage save fail', e); }
  uploadBtn.disabled = false;
  fileInput.value = '';
});

/* Helpful: allow clicking outside modal to close */
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});
