/**
 * Native Text-To-Speech announcement for hospital queue tickets
 * using browser Web Speech API (window.speechSynthesis).
 */
export function announceTicket(ticketId, serviceName) {
    if (!('speechSynthesis' in window)) {
        return;
    }
    try {
        window.speechSynthesis.cancel();
        // Spell ticket letters and digits clearly (e.g., "A - 0 0 1")
        const formattedId = ticketId.split('').join(' ');
        const text = `Nomor antrean, ${formattedId}, silakan menuju loket ${serviceName}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }
    catch (err) {
        console.warn('Gagal memutar audio antrean:', err);
    }
}
//# sourceMappingURL=speech.js.map