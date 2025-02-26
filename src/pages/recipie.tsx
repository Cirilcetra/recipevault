import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './recipe.css';
import { useState, useEffect } from 'react';

const Recipe = () => {
  const navigate = useNavigate();
  const recipe = localStorage.getItem('currentRecipe') || '';
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const updatedFavorites = favorites.filter((fav: string) => fav !== recipe);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } else {
      favorites.push(recipe);
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    setIsFavorite(!isFavorite);
  };

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(recipe));
  }, [recipe]);

  return (
    <>
      <header className="recipe-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <svg 
            width="27" 
            height="27" 
            viewBox="0 0 27 27" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M5.90625 12.6562H22.7812C23.005 12.6562 23.2196 12.7451 23.3779 12.9034C23.5361 13.0616 23.625 13.2762 23.625 13.5C23.625 13.7238 23.5361 13.9384 23.3779 14.0966C23.2196 14.2549 23.005 14.3438 22.7812 14.3438H5.90625C5.68247 14.3438 5.46786 14.2549 5.30963 14.0966C5.15139 13.9384 5.0625 13.7238 5.0625 13.5C5.0625 13.2762 5.15139 13.0616 5.30963 12.9034C5.46786 12.7451 5.68247 12.6562 5.90625 12.6562Z" 
              fill="#424242"
            />
            <path 
              d="M6.25558 13.5L13.2536 20.4964C13.4121 20.6548 13.5011 20.8697 13.5011 21.0937C13.5011 21.3178 13.4121 21.5327 13.2536 21.6911C13.0952 21.8496 12.8803 21.9386 12.6563 21.9386C12.4322 21.9386 12.2173 21.8496 12.0589 21.6911L4.46514 14.0974C4.38656 14.019 4.32422 13.9259 4.28169 13.8234C4.23915 13.7209 4.21725 13.611 4.21725 13.5C4.21725 13.389 4.23915 13.2791 4.28169 13.1766C4.32422 13.0741 4.38656 12.981 4.46514 12.9026L12.0589 5.30887C12.2173 5.15044 12.4322 5.06143 12.6563 5.06143C12.8803 5.06143 13.0952 5.15044 13.2536 5.30887C13.4121 5.46731 13.5011 5.68219 13.5011 5.90625C13.5011 6.13031 13.4121 6.34519 13.2536 6.50362L6.25558 13.5Z" 
              fill="#424242"
            />
          </svg>
        </button>
        <div className="recipe-header-text">
          <h1 className="recipe-title">{recipe.split('\n')[0].replace(/^#\s*/, '')}</h1>
        </div>
        <button 
          className="favorite-button"
          onClick={toggleFavorite}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill={isFavorite ? "#FFD700" : "none"}
            stroke="#424242"
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>
      </header>
      <div className="recipe-content">
        <ReactMarkdown>{recipe}</ReactMarkdown>
      </div>
    </>
  );
};

export default Recipe;
