// Fonction pour afficher les notifications toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Fonction pour mettre à jour les statistiques
async function updateStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        // Mise à jour des statistiques
        document.querySelector('[data-stat="servers"]').textContent = data.servers;
        document.querySelector('[data-stat="users"]').textContent = data.users;
        document.querySelector('[data-stat="commands"]').textContent = data.commands;

    } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
        showToast('Erreur lors de la mise à jour des statistiques', 'error');
    }
}

// Fonction pour charger l'activité récente
async function loadRecentActivity() {
    try {
        const response = await fetch('/api/activity');
        const data = await response.json();

        const activityContainer = document.querySelector('.activity-container');
        activityContainer.innerHTML = '';

        if (data.activities.length === 0) {
            activityContainer.innerHTML = '<p class="text-gray-400">Aucune activité récente</p>';
            return;
        }

        data.activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'flex items-center space-x-4 p-4 hover:bg-gray-700 rounded-lg transition-colors';
            activityElement.innerHTML = `
                <div class="flex-shrink-0">
                    <i class="fas ${getActivityIcon(activity.type)} text-${getActivityColor(activity.type)}"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm">${activity.description}</p>
                    <p class="text-xs text-gray-400">${formatDate(activity.timestamp)}</p>
                </div>
            `;
            activityContainer.appendChild(activityElement);
        });

    } catch (error) {
        console.error('Erreur lors du chargement de l\'activité:', error);
        showToast('Erreur lors du chargement de l\'activité', 'error');
    }
}

// Fonction utilitaire pour obtenir l'icône en fonction du type d'activité
function getActivityIcon(type) {
    const icons = {
        'command': 'fa-terminal',
        'join': 'fa-user-plus',
        'leave': 'fa-user-minus',
        'error': 'fa-exclamation-circle',
        'default': 'fa-info-circle'
    };
    return icons[type] || icons.default;
}

// Fonction utilitaire pour obtenir la couleur en fonction du type d'activité
function getActivityColor(type) {
    const colors = {
        'command': 'green-500',
        'join': 'blue-500',
        'leave': 'yellow-500',
        'error': 'red-500',
        'default': 'gray-500'
    };
    return colors[type] || colors.default;
}

// Fonction utilitaire pour formater la date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(
        Math.round((date - new Date()) / (1000 * 60)),
        'minute'
    );
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Mise à jour initiale des statistiques
    updateStats();

    // Mise à jour initiale de l'activité
    loadRecentActivity();

    // Mise à jour périodique des statistiques (toutes les 30 secondes)
    setInterval(updateStats, 30000);

    // Mise à jour périodique de l'activité (toutes les minutes)
    setInterval(loadRecentActivity, 60000);

    // Gestion des clics sur les liens de navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            document.querySelectorAll('nav a').forEach(l => l.classList.remove('bg-gray-700'));
            link.classList.add('bg-gray-700');
        });
    });
}); 