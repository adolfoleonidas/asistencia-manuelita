// =====================================================
// UTILIDADES COMPARTIDAS
// =====================================================

/**
 * Escapa caracteres HTML para prevenir XSS al inyectar
 * datos de usuario en el DOM via innerHTML.
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
