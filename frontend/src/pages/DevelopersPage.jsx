import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DevelopersPage = () => {
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Developer data - Add more developers here in the future
  const developersData = [
    {
      name: "Surya Kant Tiwari",
      role: "Lead Developer",
      github: "SuryaKTiwari11",
      contributions: [
        "Portal Architecture & Design",
        "Backend Development",
        "Database Design",
        "Authentication System"
      ],
     
    },
    {
      name: "Akshat Kakkar",
      role: "Product & Strategy Lead",
      github: "akshatkakkar1",
      contributions: [
        "Original Idea & Vision",
        "Conceptualization of Portal",
        "Brainstorming Features",
        "Product Flow Design"
      ],
    }
    // Add more developers here as needed:
    // {
    //   name: "Developer Name",
    //   role: "Role/Position",
    //   github: "github-username",
    //   contributions: ["List", "of", "contributions"],
    //   bio: "Short bio"
    // }
  ];

  useEffect(() => {
    // Fetch GitHub profile data for each developer
    const fetchGitHubData = async () => {
      try {
        const enrichedDevelopers = await Promise.all(
          developersData.map(async (dev) => {
            try {
              const response = await fetch(`https://api.github.com/users/${dev.github}`);
              //it there a way to store and cache it so that we don't hit rate limits?
              if (response.ok) {
                const githubData = await response.json();
                return {
                  ...dev,
                  avatar: githubData.avatar_url,
                  githubUrl: githubData.html_url,
                  githubBio: githubData.bio,
                  location: githubData.location,
                  publicRepos: githubData.public_repos,
                  followers: githubData.followers
                };
              }
              // Fallback if API fails
              return {
                ...dev,
                avatar: `https://github.com/${dev.github}.png`,
                githubUrl: `https://github.com/${dev.github}`
              };
            } catch (error) {
              // Fallback if API fails
              return {
                ...dev,
                avatar: `https://github.com/${dev.github}.png`,
                githubUrl: `https://github.com/${dev.github}`
              };
            }
          })
        );
        setDevelopers(enrichedDevelopers);
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Meet the Developers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The talented individuals who brought the Thapar Lost & Found Portal to life
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {developers.map((dev, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full md:w-96"
              >
                {/* Profile Header with Avatar */}
                <div className="relative h-32 bg-gradient-to-r from-gray-800 to-gray-900">
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                    <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg">
                      <img
                        src={dev.avatar}
                        alt={dev.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-20 px-6 pb-6">
                  {/* Name and Role */}
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold mb-1 text-gray-900">
                      {dev.name}
                    </h2>
                    <p className="text-sm font-medium text-gray-800">
                      {dev.role}
                    </p>
                    {/* {dev.location && (
                      <p className="text-sm mt-1 text-gray-500">
                        📍 {dev.location}
                      </p>
                    )} */}
                  </div>

                  {/* Bio */}
                  {/* <div className="text-center mb-4 text-gray-600 text-sm leading-relaxed">
                    <p>{dev.githubBio || dev.bio}</p>
                  </div> */}

                  {/* GitHub Stats */}
                  {/* {(dev.publicRepos || dev.followers) && (
                    <div className="flex justify-center gap-6 mb-4 pb-4 border-b border-gray-200">
                      {dev.publicRepos && (
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {dev.publicRepos}
                          </div>
                          <div className="text-xs text-gray-500">
                            Repositories
                          </div>
                        </div>
                      )}
                      {dev.followers && (
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {dev.followers}
                          </div>
                          <div className="text-xs text-gray-500">
                            Followers
                          </div>
                        </div>
                      )}
                    </div>
                  )} */}

                  {/* Contributions */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-gray-800">
                      Key Contributions:
                    </h3>
                    <ul className="space-y-2">
                      {dev.contributions.map((contribution, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start text-gray-600"
                        >
                          <span className="mr-2 mt-1 text-gray-900">
                            ✓
                          </span>
                          {contribution}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* GitHub Link */}
                  <div className="mt-6">
                    <a
                      href={dev.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex justify-center items-center py-3 rounded-lg font-semibold transition-all duration-200 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <span className="inline-flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        View GitHub Profile
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevelopersPage;