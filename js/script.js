document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([-14.235, -51.925], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let allLocations = []; // Armazena todos os locais carregados
    let currentMarkers = []; // Armazena os marcadores atualmente no mapa
    let activeDetailsContainer = null; // Rastreia o container de detalhes atualmente aberto
    let activeListItemElement = null; // Rastreia o elemento <li> atualmente ativo

    const locationListElement = document.getElementById('location-list');
    const filterInput = document.getElementById('filter-input');

    // Função para limpar marcadores e lista e adicionar novos
    const updateMapAndList = (locationsToDisplay) => {
        // Limpa marcadores existentes
        currentMarkers.forEach(marker => map.removeLayer(marker));
        currentMarkers = [];

        // Limpa a lista de locais
        locationListElement.innerHTML = '';
        activeDetailsContainer = null; // Reseta o container ativo ao atualizar a lista
        activeListItemElement = null; // Reseta o item ativo ao atualizar a lista

        locationsToDisplay.forEach((location, index) => {
            // Verifica se latitude e longitude existem
            if (location.latitude && location.longitude) {
                const fullAddress = `${location.street}, ${location.city}, ${location.province}, ${location.postal_code}, ${location.country}`;
                const displayName = `${location.city} (${location.street})`;
                const imageUrl = location.image_url || 'https://via.placeholder.com/50/CCCCCC/000000?text=NoImg'; // Imagem padrão se não houver

                // Conteúdo do pop-up com miniatura da imagem
                const popupContent = `
                    <div>
                        <b>${displayName}</b><br>
                        <img src="${imageUrl}" alt="${displayName}" style="width:50px; height:50px; object-fit:cover; margin-top:5px;"><br>
                        ${fullAddress}
                    </div>
                `;

                // Adiciona marcador no mapa
                const marker = L.marker([location.latitude, location.longitude])
                    .addTo(map)
                    .bindPopup(popupContent);
                
                // Adiciona evento de clique ao marcador para centralizar e abrir pop-up
                marker.on('click', () => {
                    map.setView([location.latitude, location.longitude], 15);
                    marker.openPopup();
                });
                
                currentMarkers.push(marker);

                // Cria o item da lista
                const listItem = document.createElement('li');
                listItem.dataset.index = index; // Usar índice para referência, se necessário
                
                // Adiciona o nome do local
                const locationNameSpan = document.createElement('span');
                locationNameSpan.textContent = displayName;
                listItem.appendChild(locationNameSpan);

                // Cria o container para os detalhes (imagem e endereço completo)
                const detailsContainer = document.createElement('div');
                detailsContainer.classList.add('location-item-details');
                detailsContainer.classList.add('hidden'); // Esconde por padrão

                const detailImage = document.createElement('img');
                detailImage.src = imageUrl;
                detailImage.alt = displayName;
                detailImage.style.maxWidth = '100%';
                detailImage.style.height = 'auto';
                detailImage.style.borderRadius = '4px';
                detailImage.style.marginTop = '10px';
                detailsContainer.appendChild(detailImage);

                const detailAddress = document.createElement('p');
                detailAddress.innerHTML = `
                    <strong>Rua:</strong> ${location.street}<br>
                    <strong>Cidade:</strong> ${location.city}<br>
                    <strong>Província:</strong> ${location.province}<br>
                    <strong>CEP:</strong> ${location.postal_code}<br>
                    <strong>País:</strong> ${location.country}
                `;
                detailAddress.style.fontSize = '0.9em';
                detailAddress.style.color = '#555';
                detailAddress.style.lineHeight = '1.4';
                detailsContainer.appendChild(detailAddress);

                listItem.appendChild(detailsContainer);

                // Adiciona evento de clique para centralizar no marcador e toggle dos detalhes
                listItem.addEventListener('click', () => {
                    map.setView([location.latitude, location.longitude], 15);
                    marker.openPopup();

                    // Lógica de acordeão
                    if (activeDetailsContainer && activeDetailsContainer !== detailsContainer) {
                        activeDetailsContainer.classList.add('hidden');
                        activeListItemElement.classList.remove('active');
                    }

                    detailsContainer.classList.toggle('hidden');
                    listItem.classList.toggle('active');

                    if (!detailsContainer.classList.contains('hidden')) {
                        activeDetailsContainer = detailsContainer;
                        activeListItemElement = listItem;
                    } else {
                        activeDetailsContainer = null;
                        activeListItemElement = null;
                    }
                });

                locationListElement.appendChild(listItem);
            }
        });
    };

    // Carrega os dados do address.json
    fetch('address.json')
        .then(response => response.json())
        .then(locations => {
            allLocations = locations;
            
            const validLatLngs = [];
            allLocations.forEach(loc => {
                if (loc.latitude && loc.longitude) {
                    validLatLngs.push([loc.latitude, loc.longitude]);
                }
            });

            if (validLatLngs.length > 0) {
                // Ajusta a visão do mapa para englobar todos os marcadores
                map.fitBounds(L.latLngBounds(validLatLngs));
            } else {
                // Se não houver locais válidos, mantém a visão padrão do Brasil
                map.setView([-14.235, -51.925], 4);
            }

            updateMapAndList(allLocations); // Exibe todos os locais inicialmente
        })
        .catch(error => {
            console.error('Erro ao carregar o arquivo de endereços:', error);
        });

    // Event listener para o campo de filtro
    filterInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredLocations = allLocations.filter(location => 
            (location.street && location.street.toLowerCase().includes(searchTerm)) ||
            (location.city && location.city.toLowerCase().includes(searchTerm)) ||
            (location.province && location.province.toLowerCase().includes(searchTerm)) ||
            (location.country && location.country.toLowerCase().includes(searchTerm))
        );
        updateMapAndList(filteredLocations);
    });
});
