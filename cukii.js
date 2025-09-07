    const form = document.getElementById('donateForm');
    const amountInput = document.getElementById('amount');
    const qrisContainer = document.querySelector('.qris-container');
    const errorMessage = document.querySelector('.error-message');
    const submitButton = form.querySelector('button');
    
    let countdownInterval = null;
    
    function formatTimeLeft(ms) {
      if (ms <= 0) return '00:00:00';
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    
    function startCountdown(expiredISO) {
      if (countdownInterval) clearInterval(countdownInterval);
      
      const countdownEl = document.createElement('div');
      countdownEl.className = 'countdown';
      qrisContainer.appendChild(countdownEl);
      
      function update() {
        const now = new Date();
        const expired = new Date(expiredISO);
        const diff = expired - now;
        
        if (diff <= 0) {
          clearInterval(countdownInterval);
          countdownEl.textContent = 'QRIS sudah kedaluwarsa.';
          const img = qrisContainer.querySelector('img');
          const btn = qrisContainer.querySelector('.download-btn');
          if (img) img.remove();
          if (btn) btn.remove();
          submitButton.disabled = false;
          submitButton.setAttribute('aria-busy', 'false');
          return;
        }
        
        countdownEl.textContent = `QRIS aktif selama: ${formatTimeLeft(diff)}`;
      }
      
      update();
      countdownInterval = setInterval(update, 1000);
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.textContent = '';
      qrisContainer.innerHTML = '';
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      
      let amount = parseFloat(amountInput.value);
      
      if (isNaN(amount) || amount < 1000) {
        errorMessage.textContent = 'Masukkan jumlah donate.';
        submitButton.disabled = false;
        submitButton.setAttribute('aria-busy', 'false');
        return;
      }
      
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      qrisContainer.appendChild(spinner);
      
      try {
        const imageUrl = encodeURIComponent('https://imagetourl.unaux.com/uploader/28juli2025/bt4zwmar.jpeg');
        const apikey = 'planaai';
        const amountRounded = Math.round(amount);
        const apiUrl = `https://www.sankavollerei.com/orderkuota/createqris?apikey=${apikey}&amount=${amountRounded}&url=${imageUrl}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal menghubungi server.');
        
        const data = await response.json();
        
        if (data.status && data.result && data.result.imageqris && data.result.imageqris.url) {
          qrisContainer.innerHTML = '';
          
          const img = document.createElement('img');
          img.src = data.result.imageqris.url;
          img.alt = `QRIS untuk donasi Rp ${data.result.jumlah}`;
          img.tabIndex = -1;
          qrisContainer.appendChild(img);
          
          const downloadBtn = document.createElement('button');
          downloadBtn.className = 'download-btn';
          downloadBtn.type = 'button';
          downloadBtn.textContent = 'Download QRIS';
          downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = data.result.imageqris.url;
            link.download = `qris_donasi_${data.result.idtransaksi}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
          qrisContainer.appendChild(downloadBtn);
          
          startCountdown(data.result.expired);
          
          img.focus();
        } else {
          throw new Error('Data QRIS tidak valid.');
        }
      } catch (err) {
        qrisContainer.innerHTML = '';
        errorMessage.textContent = err.message || 'Terjadi kesalahan saat memuat QRIS.';
      } finally {
        if (!countdownInterval) {
          submitButton.disabled = false;
          submitButton.setAttribute('aria-busy', 'false');
        }
      }
    });
