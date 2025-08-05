console.log('CloakForge - Privacy • Security • Freedom');

// Search functionality with filtering
let searchIndex = [];
let searchInput;
let searchResults;
let categoryFilter;
let tagFilter;
let sectionFilter;
let clearFiltersBtn;
let allCategories = new Set();
let allTags = new Set();

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
        const searchBox = document.getElementById('search-input');
        const searchFilters = document.querySelector('.search-filters');
        const searchContainer = document.querySelector('.search-container');
        const searchButton = document.getElementById('search-btn');
        const searchResults = document.getElementById('search-results');
        const categoryFilter = document.getElementById('category-filter');
        const tagFilter = document.getElementById('tag-filter');
        const sectionFilter = document.getElementById('section-filter');
        
        let searchIndex = [];
        
        // Show filters when search box is focused/clicked
        searchBox.addEventListener('focus', function() {
            if (searchFilters) {
                searchFilters.classList.add('show');
                searchContainer.classList.add('filters-active');
            }
        });
        
        // Hide filters when clicking outside search area (optional - you can remove this if you want filters to stay visible once shown)
        document.addEventListener('click', function(e) {
            const searchContainerElement = e.target.closest('.search-container') || e.target.closest('.search-filters');
            if (!searchContainerElement && searchFilters) {
                // Only hide if search box is empty
                if (!searchBox.value.trim()) {
                    searchFilters.classList.remove('show');
                    searchContainer.classList.remove('filters-active');
                }
            }
        });    if (searchInput && searchResults) {
        // Load search index
        fetch('/index.json')
            .then(response => response.json())
            .then(data => {
                searchIndex = data;
                console.log('Search index loaded:', searchIndex.length, 'items');
                populateFilterOptions();
            })
            .catch(error => {
                console.error('Error loading search index:', error);
            });
        
        // Add search event listeners
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', handleSearchFocus);
        
        // Add filter event listeners
        if (categoryFilter) categoryFilter.addEventListener('change', handleSearch);
        if (tagFilter) tagFilter.addEventListener('change', handleSearch);
        if (sectionFilter) sectionFilter.addEventListener('change', handleSearch);
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
        
        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                hideSearchResults();
            }
        });
        
        // Handle keyboard navigation
        searchInput.addEventListener('keydown', handleKeyNavigation);
    }
});

function populateFilterOptions() {
    // Collect all unique categories and tags
    searchIndex.forEach(item => {
        if (item.categories) {
            allCategories.add(item.categories);
        }
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    // Populate category filter
    if (categoryFilter) {
        Array.from(allCategories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    // Populate tag filter
    if (tagFilter) {
        Array.from(allTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = `#${tag}`;
            tagFilter.appendChild(option);
        });
    }
    
    updateFilterButtonState();
}

function handleSearch(e) {
    const query = searchInput.value.trim().toLowerCase();
    const categoryValue = categoryFilter ? categoryFilter.value : '';
    const tagValue = tagFilter ? tagFilter.value : '';
    const sectionValue = sectionFilter ? sectionFilter.value : '';
    
    // Update filter button state
    updateFilterButtonState();
    
    // Show results if we have a query or active filters
    if (query.length >= 2 || categoryValue || tagValue || sectionValue) {
        const results = searchContent(query, categoryValue, tagValue, sectionValue);
        displaySearchResults(results, query);
    } else {
        hideSearchResults();
    }
}

function handleSearchFocus() {
    const query = searchInput.value.trim().toLowerCase();
    const categoryValue = categoryFilter ? categoryFilter.value : '';
    const tagValue = tagFilter ? tagFilter.value : '';
    const sectionValue = sectionFilter ? sectionFilter.value : '';
    
    if (query.length >= 2 || categoryValue || tagValue || sectionValue) {
        const results = searchContent(query, categoryValue, tagValue, sectionValue);
        displaySearchResults(results, query);
    }
}

function searchContent(query, categoryFilter, tagFilter, sectionFilter) {
    return searchIndex.filter(item => {
        // Text search (if query provided)
        let textMatch = true;
        if (query.length >= 2) {
            const titleMatch = item.title.toLowerCase().includes(query);
            const contentMatch = item.content.toLowerCase().includes(query);
            const summaryMatch = item.summary.toLowerCase().includes(query);
            const tagMatch = item.tags && item.tags.some(tag => tag.toLowerCase().includes(query));
            const categoryMatch = item.categories && item.categories.toLowerCase().includes(query);
            
            textMatch = titleMatch || contentMatch || summaryMatch || tagMatch || categoryMatch;
        }
        
        // Category filter
        let categoryMatch = true;
        if (categoryFilter) {
            categoryMatch = item.categories === categoryFilter;
        }
        
        // Tag filter
        let tagMatch = true;
        if (tagFilter) {
            tagMatch = item.tags && item.tags.includes(tagFilter);
        }
        
        // Section filter
        let sectionMatch = true;
        if (sectionFilter) {
            sectionMatch = item.section === sectionFilter;
        }
        
        return textMatch && categoryMatch && tagMatch && sectionMatch;
    }).slice(0, 12); // Increased limit for filtered results
}

function displaySearchResults(results, query) {
    const activeFilters = getActiveFilters();
    const filterSummary = activeFilters.length > 0 ? 
        `<div class="search-filter-summary">Filtered by: ${activeFilters.join(', ')}</div>` : '';
    
    if (results.length === 0) {
        const noResultsMsg = query ? `No results found for "${query}"` : 'No results match the selected filters';
        searchResults.innerHTML = `
            ${filterSummary}
            <div class="search-no-results">
                ${noResultsMsg}
            </div>
        `;
    } else {
        const resultText = results.length === 1 ? 'result' : 'results';
        searchResults.innerHTML = `
            ${filterSummary}
            <div class="search-results-count">${results.length} ${resultText} found</div>
            ${results.map(item => `
                <div class="search-result-item" onclick="window.location.href='${item.href}'">
                    <div class="search-result-title">${highlightText(item.title, query)}</div>
                    <div class="search-result-summary">${highlightText(truncateText(item.summary, 120), query)}</div>
                    <div class="search-result-meta">
                        <span class="search-result-section">${item.section}</span>
                        ${item.categories ? `<span class="text-muted">${item.categories}</span>` : ''}
                        ${item.tags ? item.tags.slice(0, 3).map(tag => `<span class="search-tag">#${tag}</span>`).join('') : ''}
                    </div>
                </div>
            `).join('')}
        `;
    }
    
    showSearchResults();
}

function getActiveFilters() {
    const filters = [];
    if (categoryFilter && categoryFilter.value) filters.push(`Category: ${categoryFilter.value}`);
    if (tagFilter && tagFilter.value) filters.push(`Tag: #${tagFilter.value}`);
    if (sectionFilter && sectionFilter.value) filters.push(`Section: ${sectionFilter.value}`);
    return filters;
}

function updateFilterButtonState() {
    if (clearFiltersBtn) {
        const hasActiveFilters = (categoryFilter && categoryFilter.value) || 
                               (tagFilter && tagFilter.value) || 
                               (sectionFilter && sectionFilter.value);
        
        clearFiltersBtn.disabled = !hasActiveFilters;
        
        // Update filter select styling
        [categoryFilter, tagFilter, sectionFilter].forEach(filter => {
            if (filter) {
                if (filter.value) {
                    filter.classList.add('filter-active');
                } else {
                    filter.classList.remove('filter-active');
                }
            }
        });
    }
}

function clearAllFilters() {
    if (categoryFilter) categoryFilter.value = '';
    if (tagFilter) tagFilter.value = '';
    if (sectionFilter) sectionFilter.value = '';
    
    updateFilterButtonState();
    handleSearch();
}

function highlightText(text, query) {
    if (!text || !query) return text;
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background-color: var(--accent-tertiary); color: var(--text-primary); padding: 0 2px; border-radius: 2px;">$1</mark>');
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showSearchResults() {
    searchResults.style.display = 'block';
}

function hideSearchResults() {
    searchResults.style.display = 'none';
}

function handleKeyNavigation(e) {
    const items = searchResults.querySelectorAll('.search-result-item');
    const currentActive = searchResults.querySelector('.search-result-item.active');
    let activeIndex = -1;
    
    if (currentActive) {
        activeIndex = Array.from(items).indexOf(currentActive);
    }
    
    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (activeIndex < items.length - 1) {
                if (currentActive) currentActive.classList.remove('active');
                items[activeIndex + 1].classList.add('active');
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (activeIndex > 0) {
                if (currentActive) currentActive.classList.remove('active');
                items[activeIndex - 1].classList.add('active');
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (currentActive) {
                currentActive.click();
            }
            break;
        case 'Escape':
            hideSearchResults();
            searchInput.blur();
            break;
    }
}
