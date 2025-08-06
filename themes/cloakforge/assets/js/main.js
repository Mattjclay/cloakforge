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
        // Initialize theme switcher
        initializeThemeSwitcher();
        
        // Initialize font switcher
        initializeFontSwitcher();
        
        const searchBox = document.getElementById('search-input');
        const searchFilters = document.querySelector('.search-filters');
        const searchContainer = document.querySelector('.search-container');
        const searchButton = document.getElementById('search-btn');
        
        // Assign global variables
        searchInput = document.getElementById('search-input');
        searchResults = document.getElementById('search-results');
        categoryFilter = document.getElementById('category-filter');
        tagFilter = document.getElementById('tag-filter');
        sectionFilter = document.getElementById('section-filter');
        clearFiltersBtn = document.getElementById('clear-filters');
        
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
        });
        
    if (searchInput && searchResults) {
        // Load search index
        fetch('/index.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                searchIndex = data;
                console.log('Search index loaded:', searchIndex.length, 'items');
                populateFilterOptions();
            })
            .catch(error => {
                console.error('Error loading search index:', error);
                // Try alternative path for Cloudflare Pages
                return fetch('./index.json')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        searchIndex = data;
                        console.log('Search index loaded (alternative path):', searchIndex.length, 'items');
                        populateFilterOptions();
                    })
                    .catch(altError => {
                        console.error('Error loading search index from alternative path:', altError);
                        searchResults.innerHTML = '<div class="alert alert-warning">Search functionality is currently unavailable. Please try again later.</div>';
                    });
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
        if (item.categories && Array.isArray(item.categories)) {
            item.categories.forEach(category => {
                if (category && category.trim()) { // Only add non-empty categories
                    allCategories.add(category);
                }
            });
        } else if (item.categories && typeof item.categories === 'string' && item.categories.trim()) {
            allCategories.add(item.categories);
        }
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
                if (tag && tag.trim()) { // Only add non-empty tags
                    allTags.add(tag);
                }
            });
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

// Fuzzy search functionality
function fuzzyMatch(pattern, text, threshold = 0.6) {
    if (!pattern || !text) return { matches: false, score: 0 };
    
    pattern = pattern.toLowerCase();
    text = text.toLowerCase();
    
    // Exact match gets highest score
    if (text.includes(pattern)) {
        return { matches: true, score: 1.0 };
    }
    
    // Calculate Levenshtein distance for fuzzy matching
    const distance = levenshteinDistance(pattern, text);
    const maxLength = Math.max(pattern.length, text.length);
    const score = 1 - (distance / maxLength);
    
    // Also check for partial word matches and acronyms
    const words = text.split(/\s+/);
    let bestWordScore = 0;
    
    for (const word of words) {
        // Check if pattern matches beginning of word
        if (word.startsWith(pattern)) {
            bestWordScore = Math.max(bestWordScore, 0.8);
        }
        // Check if pattern matches word with some tolerance
        const wordDistance = levenshteinDistance(pattern, word);
        const wordScore = 1 - (wordDistance / Math.max(pattern.length, word.length));
        bestWordScore = Math.max(bestWordScore, wordScore);
    }
    
    // Check for acronym match (first letters of words)
    const acronym = words.map(word => word.charAt(0)).join('');
    if (acronym.includes(pattern)) {
        bestWordScore = Math.max(bestWordScore, 0.7);
    }
    
    const finalScore = Math.max(score, bestWordScore);
    return { matches: finalScore >= threshold, score: finalScore };
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

function searchContent(query, categoryFilter, tagFilter, sectionFilter) {
    let results = searchIndex.filter(item => {
        // Category filter
        let categoryMatch = true;
        if (categoryFilter) {
            if (Array.isArray(item.categories)) {
                categoryMatch = item.categories.includes(categoryFilter);
            } else if (typeof item.categories === 'string') {
                categoryMatch = item.categories === categoryFilter;
            } else {
                categoryMatch = false;
            }
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
        
        return categoryMatch && tagMatch && sectionMatch;
    });
    
    // Apply fuzzy text search if query provided
    if (query.length >= 2) {
        const searchResults = results.map(item => {
            let bestScore = 0;
            let matchType = '';
            
            // Check title (highest priority)
            const titleMatch = fuzzyMatch(query, item.title, 0.4);
            if (titleMatch.matches) {
                bestScore = Math.max(bestScore, titleMatch.score * 1.0);
                matchType = 'title';
            }
            
            // Check summary/description
            const summaryMatch = fuzzyMatch(query, item.summary || '', 0.5);
            if (summaryMatch.matches) {
                bestScore = Math.max(bestScore, summaryMatch.score * 0.8);
                if (!matchType) matchType = 'summary';
            }
            
            // Check content (lower priority)
            const contentMatch = fuzzyMatch(query, item.content || '', 0.6);
            if (contentMatch.matches) {
                bestScore = Math.max(bestScore, contentMatch.score * 0.6);
                if (!matchType) matchType = 'content';
            }
            
            // Check tags
            if (item.tags) {
                for (const tag of item.tags) {
                    const tagMatch = fuzzyMatch(query, tag, 0.4);
                    if (tagMatch.matches) {
                        bestScore = Math.max(bestScore, tagMatch.score * 0.9);
                        if (!matchType) matchType = 'tag';
                    }
                }
            }
            
            // Check categories
            const categories = Array.isArray(item.categories) ? item.categories : [item.categories];
            for (const category of categories) {
                if (category) {
                    const categoryMatch = fuzzyMatch(query, category, 0.4);
                    if (categoryMatch.matches) {
                        bestScore = Math.max(bestScore, categoryMatch.score * 0.7);
                        if (!matchType) matchType = 'category';
                    }
                }
            }
            
            return {
                ...item,
                searchScore: bestScore,
                matchType: matchType
            };
        }).filter(item => item.searchScore > 0)
          .sort((a, b) => b.searchScore - a.searchScore);
        
        return searchResults.slice(0, 12);
    }
    
    return results.slice(0, 12);
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

// Theme Switcher Functionality
function initializeThemeSwitcher() {
    // Get saved theme from localStorage or default to 'vscode-dark'
    const savedTheme = localStorage.getItem('cloakforge-theme') || 'vscode-dark';
    applyTheme(savedTheme);
    
    // Add event listeners to theme options
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const theme = this.getAttribute('data-theme');
            applyTheme(theme);
            
            // Update active state
            themeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Save theme preference
            localStorage.setItem('cloakforge-theme', theme);
        });
    });
}

function applyTheme(theme) {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update current theme display
    const currentThemeSpan = document.getElementById('current-theme');
    const themeNames = {
        'light': 'VS Code Light',
        'vscode-dark': 'VS Code Dark',
        'cloakforge-blue': 'CloakForge Blue',
        'cyberpunk': 'Cyberpunk',
        'matrix': 'Matrix',
        'hacker': 'Hacker',
        'red-alert': 'Red Alert',
        'dracula': 'Dracula',
        'monokai': 'Monokai',
        'solarized-dark': 'Solarized Dark',
        'one-dark': 'One Dark',
        'github-dark': 'GitHub Dark',
        'gruvbox-dark': 'Gruvbox Dark',
        'nord': 'Nord',
        'catppuccin': 'Catppuccin',
        'tokyo-night': 'Tokyo Night',
        'oceanic-next': 'Oceanic Next'
    };
    
    if (currentThemeSpan) {
        currentThemeSpan.textContent = themeNames[theme] || 'VS Code Dark';
    }
    
    // Update active state in dropdown
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    console.log(`Theme switched to: ${themeNames[theme] || theme}`);
}

// Font Switcher Functionality
function initializeFontSwitcher() {
    const savedFont = localStorage.getItem('selectedFont') || 'Inter';
    
    // Apply saved font on load
    applyFont(savedFont);
    
    // Add click listeners to font options using event delegation
    document.addEventListener('click', function(e) {
        if (e.target.closest('.font-option')) {
            e.preventDefault();
            const fontOption = e.target.closest('.font-option');
            const font = fontOption.getAttribute('data-font');
            console.log('Font option clicked:', font);
            applyFont(font);
            localStorage.setItem('selectedFont', font);
        }
    });
    
    console.log('Font switcher initialized with font:', savedFont);
}

function applyFont(font) {
    // Map font names to their CSS font-family values
    const fontFamilies = {
        'Inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Roboto': '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'Open Sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Lato': '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Poppins': '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Source Sans Pro': '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Nunito': '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Raleway': '"Raleway", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Ubuntu': '"Ubuntu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Fira Sans': '"Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'JetBrains Mono': '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace'
    };
    
    // Remove any existing font override style
    const existingStyle = document.getElementById('font-override');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Create and inject CSS with high specificity to override theme styles
    const fontFamily = fontFamilies[font] || fontFamilies['Inter'];
    const style = document.createElement('style');
    style.id = 'font-override';
    style.textContent = `
        body, html, .container, .content, p, h1, h2, h3, h4, h5, h6, 
        .navbar, .nav-link, .btn, .card, .card-body, .card-title, 
        .hero-section, .search-container, .app-card, .section-title,
        .dropdown-item, .theme-option, .font-option, div, span, a {
            font-family: ${fontFamily} !important;
        }
        
        /* Preserve individual font previews in dropdown */
        .font-preview[style*="Inter"] { font-family: "Inter", sans-serif !important; }
        .font-preview[style*="Roboto"] { font-family: "Roboto", sans-serif !important; }
        .font-preview[style*="Open Sans"] { font-family: "Open Sans", sans-serif !important; }
        .font-preview[style*="Lato"] { font-family: "Lato", sans-serif !important; }
        .font-preview[style*="Montserrat"] { font-family: "Montserrat", sans-serif !important; }
        .font-preview[style*="Poppins"] { font-family: "Poppins", sans-serif !important; }
        .font-preview[style*="Source Sans Pro"] { font-family: "Source Sans Pro", sans-serif !important; }
        .font-preview[style*="Nunito"] { font-family: "Nunito", sans-serif !important; }
        .font-preview[style*="Raleway"] { font-family: "Raleway", sans-serif !important; }
        .font-preview[style*="Ubuntu"] { font-family: "Ubuntu", sans-serif !important; }
        .font-preview[style*="Fira Sans"] { font-family: "Fira Sans", sans-serif !important; }
        .font-preview[style*="JetBrains Mono"] { font-family: "JetBrains Mono", monospace !important; }
        
        /* Preserve monospace for code elements */
        code, pre, .code, .highlight {
            font-family: ${font === 'JetBrains Mono' ? fontFamily : '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace'} !important;
        }
    `;
    document.head.appendChild(style);
    
    // Update current font display in button
    const currentFontSpan = document.getElementById('current-font');
    if (currentFontSpan) {
        currentFontSpan.textContent = font;
    }
    
    // Update active state in dropdown
    const fontOptions = document.querySelectorAll('.font-option');
    fontOptions.forEach(option => {
        if (option.getAttribute('data-font') === font) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    console.log(`Font switched to: ${font}`);
}
