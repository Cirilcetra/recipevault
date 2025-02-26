import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './mainpage.css';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [channelTitle, setChannelTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [videoDetails, setVideoDetails] = useState('');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Set up real-time listener for recipes
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recipesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(recipesData);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError('');
    
    try {
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        throw new Error('Please enter a valid YouTube URL');
      }

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:8000/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process video');
      }

      const data = await response.json();
      
      // Extract title and description from the recipe
      const recipeLines = data.recipe.split('\n');
      const recipeName = recipeLines[0].replace('# ', ''); // Remove markdown heading
      
      // Get the description (usually the next non-empty lines after title)
      let description = '';
      for (let i = 1; i < recipeLines.length; i++) {
        const line = recipeLines[i].trim();
        if (line && !line.startsWith('#')) {
          description = line;
          break;
        }
      }

      // Add to local recipes
      const newRecipe = {
        id: Date.now().toString(),
        title: recipeName,
        description: description,
        recipe: data.recipe,
        channelTitle: data.videoDetails.channelTitle || 'Unknown Channel',
        createdAt: new Date().toISOString()
      };

      setRecipes(prevRecipes => [newRecipe, ...prevRecipes]);
      setUrl(''); // Clear input after successful submission
    } catch (error: any) {
      console.error('Error details:', error);
      setError(error.message || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = () => {
    navigate('/recipe');
  };

  return (
    <div className="main-page">
      <header className="header-green">
        <div className="header-content">
          <div className="logo">
            <svg width="201" height="36" viewBox="0 0 201 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.524 27H0.916V0.684H10.96C16.936 0.684 20.428 3.708 20.428 8.892C20.428 12.42 18.772 14.94 15.676 16.2L20.68 27H15.64L11.176 17.172H5.524V27ZM5.524 4.788V13.104H10.96C13.876 13.104 15.604 11.556 15.604 8.892C15.604 6.264 13.876 4.788 10.96 4.788H5.524ZM31.0756 27.468C25.7836 27.468 22.0756 23.616 22.0756 18.108C22.0756 12.528 25.7116 8.676 30.9316 8.676C36.2596 8.676 39.6436 12.24 39.6436 17.784V19.116L26.2516 19.152C26.5756 22.284 28.2316 23.868 31.1476 23.868C33.5596 23.868 35.1436 22.932 35.6476 21.24H39.7156C38.9596 25.128 35.7196 27.468 31.0756 27.468ZM30.9676 12.276C28.3756 12.276 26.7916 13.68 26.3596 16.344H35.2876C35.2876 13.896 33.5956 12.276 30.9676 12.276ZM42.1146 18.072C42.1146 12.564 45.7506 8.676 51.0066 8.676C55.8666 8.676 59.1786 11.376 59.6466 15.66H55.2546C54.7506 13.644 53.2746 12.6 51.1866 12.6C48.3786 12.6 46.5066 14.724 46.5066 18.072C46.5066 21.42 48.2346 23.508 51.0426 23.508C53.2386 23.508 54.7866 22.428 55.2546 20.484H59.6826C59.1426 24.624 55.6866 27.468 51.0426 27.468C45.6426 27.468 42.1146 23.724 42.1146 18.072ZM65.1476 5.652C63.6356 5.652 62.4476 4.464 62.4476 2.988C62.4476 1.512 63.6356 0.36 65.1476 0.36C66.5876 0.36 67.7756 1.512 67.7756 2.988C67.7756 4.464 66.5876 5.652 65.1476 5.652ZM62.9516 27V9.216H67.3436V27H62.9516ZM71.8813 35.244V9.216H75.9493L76.2373 11.916C77.3173 9.864 79.6573 8.676 82.3573 8.676C87.3613 8.676 90.6733 12.312 90.6733 17.892C90.6733 23.436 87.6493 27.468 82.3573 27.468C79.6933 27.468 77.3893 26.424 76.2733 24.624V35.244H71.8813ZM76.3093 18.108C76.3093 21.312 78.2893 23.508 81.3133 23.508C84.4093 23.508 86.2453 21.276 86.2453 18.108C86.2453 14.94 84.4093 12.672 81.3133 12.672C78.2893 12.672 76.3093 14.904 76.3093 18.108ZM96.3663 5.652C94.8543 5.652 93.6663 4.464 93.6663 2.988C93.6663 1.512 94.8543 0.36 96.3663 0.36C97.8063 0.36 98.9943 1.512 98.9943 2.988C98.9943 4.464 97.8063 5.652 96.3663 5.652ZM94.1703 27V9.216H98.5623V27H94.1703ZM111.056 27.468C105.764 27.468 102.056 23.616 102.056 18.108C102.056 12.528 105.692 8.676 110.912 8.676C116.24 8.676 119.624 12.24 119.624 17.784V19.116L106.232 19.152C106.556 22.284 108.212 23.868 111.128 23.868C113.54 23.868 115.124 22.932 115.628 21.24H119.696C118.94 25.128 115.7 27.468 111.056 27.468ZM110.948 12.276C108.356 12.276 106.772 13.68 106.34 16.344H115.268C115.268 13.896 113.576 12.276 110.948 12.276Z" fill="white"/>
              <path d="M127.406 27L120.35 9.216H125.03L128.126 17.388C128.882 19.512 129.494 21.348 129.71 22.32C129.962 21.204 130.61 19.332 131.366 17.388L134.606 9.216H139.142L131.726 27H127.406ZM146.08 27.468C142.3 27.468 139.996 25.272 139.996 21.924C139.996 18.648 142.372 16.596 146.584 16.272L151.912 15.876V15.48C151.912 13.068 150.472 12.096 148.24 12.096C145.648 12.096 144.208 13.176 144.208 15.048H140.464C140.464 11.196 143.632 8.676 148.456 8.676C153.244 8.676 156.196 11.268 156.196 16.2V27H152.344L152.02 24.372C151.264 26.208 148.852 27.468 146.08 27.468ZM147.52 24.156C150.22 24.156 151.948 22.536 151.948 19.8V18.864L148.24 19.152C145.504 19.404 144.46 20.304 144.46 21.744C144.46 23.364 145.54 24.156 147.52 24.156ZM172.57 9.216H176.962V27H172.894L172.57 24.624C171.49 26.316 169.186 27.468 166.81 27.468C162.706 27.468 160.294 24.696 160.294 20.34V9.216H164.686V18.792C164.686 22.176 166.018 23.544 168.466 23.544C171.238 23.544 172.57 21.924 172.57 18.54V9.216ZM185.926 27H181.57V0.215999H185.926V27ZM196.582 27H192.19V12.888H188.77V9.216H192.19V3.672H196.582V9.216H200.038V12.888H196.582V27Z" fill="#FF9D4E"/>
            </svg>
          </div>
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search recipies"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {recipes.map((recipe) => (
        <div 
          key={recipe.id} 
          className="recipe-card" 
          onClick={() => {
            localStorage.setItem('currentRecipe', recipe.recipe);
            localStorage.setItem('channelTitle', recipe.channelTitle);
            handleRecipeClick();
          }}
        >
          <div className="recipe-card-content">
            <div className="recipe-card-header">
              <h2 className="recipe-card-title">{recipe.title}</h2>
            </div>
            <div className="recipe-card-description">
              {recipe.description}
            </div>
          </div>
        </div>
      ))}

      <div className="floating-controls">
        <div className="controls-container">
          <input 
            type="url" 
            placeholder="Youtube cooking video link"
            className="url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button 
            onClick={() => handleSubmit(url)}
            className="add-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Add recipie'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default MainPage;
