/* script.js */

const apiKey = '1ed3a23d';

document.addEventListener('DOMContentLoaded', () => {
  const movieList = document.querySelector('.results__list');
  const searchInput = document.querySelector('.search__input');
  const searchButton = document.querySelector('.search__button');
  const sortDropdown = document.querySelector('.results__filter-dropdown');
  const loadingElement = document.querySelector('.results__loading'); // Get the loading div

  let allLoadedMovies = []; // To store all fetched movies

  // Array of default movie IDs (IMDb IDs)
  const defaultMovieIds = ['tt0111161', 'tt0068646', 'tt1375666', 'tt0110912', 'tt0137523', 'tt0468569'];

  // Function to show the loading spinner
  function showLoading() {
    loadingElement.classList.add('is-loading');
  }

  // Function to hide the loading spinner
  function hideLoading() {
    loadingElement.classList.remove('is-loading');
  }

  // Function to fetch movie data by ID
  async function fetchMovieData(movieId) {
    try {
      const response = await fetch(`http://www.omdbapi.com/?i=${movieId}&apikey=${apiKey}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching movie data:', error);
      return null;
    }
  }

  // Function to fetch movies by search term
  async function fetchMoviesBySearch(searchTerm) {
    try {
      const response = await fetch(`http://www.omdbapi.com/?s=${searchTerm}&apikey=${apiKey}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching search results:', error);
      return null;
    }
  }

  // Function to create a movie card
  function createMovieCard(movie) {
    if (!movie || movie.Response === "False") {
      console.warn("Movie not found or invalid response:", movie);
      return null; // Don't create a card if the movie data is invalid
    }

    const movieCard = document.createElement('div');
    movieCard.classList.add('movie');

    movieCard.innerHTML = `
      <figure class="movie__image-wrapper">
        <img class="movie__image" src="${movie.Poster}" alt="${movie.Title} Poster">
      </figure>
      <div class="movie__details">
        <h3 class="movie__title">${movie.Title}</h3>
        <p class="movie__year">Year: ${movie.Year}</p>
        <p class="movie__rating">IMDb Rating: <strong>${movie.imdbRating}</strong></p>
      </div>
    `;
    return movieCard;
  }

  // Function to populate the movie list
  async function populateMovieList(movies) {
    movieList.innerHTML = ''; // Clear previous movies
    allLoadedMovies = movies; // Store the currently displayed movies
    hideLoading(); // Hide loading after data is displayed

    if (movies && movies.length > 0) {
      for (const movie of movies) {
        const movieCard = createMovieCard(movie);
        if (movieCard) {
          movieList.appendChild(movieCard);
        }
      }
    } else if (movies && movies.Response === "False") {
      movieList.innerHTML = '<p>No movies found matching your search.</p>';
    } else if (!movies) {
      movieList.innerHTML = '<p>Failed to fetch movies.</p>';
    }
  }

  // Function to load default movies
  async function loadDefaultMovies() {
    showLoading(); // Show loading before fetching
    const defaultMoviesData = [];
    for (const movieId of defaultMovieIds) {
      const movieData = await fetchMovieData(movieId);
      if (movieData) {
        defaultMoviesData.push(movieData);
      }
    }
    populateMovieList(defaultMoviesData);
  }

  // Event listener for search button click
  searchButton.addEventListener('click', async () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      showLoading(); // Show loading before searching
      const searchResults = await fetchMoviesBySearch(searchTerm);
      if (searchResults && searchResults.Search) {
        const detailedMovies = await Promise.all(searchResults.Search.map(movie => fetchMovieData(movie.imdbID)));
        populateMovieList(detailedMovies.filter(movie => movie)); // Filter out any failed fetches
      } else {
        populateMovieList(searchResults); // Handle cases where search might return a single movie or an error
      }
    } else {
      loadDefaultMovies();
    }
  });

  // Event listener for Enter key press in the search input
  searchInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
      searchButton.click(); // Trigger the search button click
    }
  });

  // Event listener for sort dropdown change
  sortDropdown.addEventListener('change', () => {
    showLoading(); // Show loading before sorting and repopulating
    const sortBy = sortDropdown.value;
    let sortedMovies = [...allLoadedMovies]; // Create a copy to avoid modifying the original

    switch (sortBy) {
      case 'year_asc':
        sortedMovies.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));
        break;
      case 'year_desc':
        sortedMovies.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
        break;
      case 'rating_high':
        sortedMovies.sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating));
        break;
      case 'rating_low':
        sortedMovies.sort((a, b) => parseFloat(a.imdbRating) - parseFloat(b.imdbRating));
        break;
      default:
        hideLoading(); // Hide loading if no sorting is applied
        return;
    }

    populateMovieList(sortedMovies);
  });

  // Load default movies on page load
  loadDefaultMovies();
});