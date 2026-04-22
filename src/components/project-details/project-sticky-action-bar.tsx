'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Heart, Share2, X } from 'lucide-react';
import type { ProjectStickyActionBarProps } from '@/lib/projects/project-types';

export default function ProjectStickyActionBar({ project }: ProjectStickyActionBarProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const shareProject = () => {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: `Check out this project: ${project.title}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePhoneCall = () => {
    // Implement phone call logic
    window.location.href = 'tel:+1234567890'; // Replace with actual phone number
  };

  const handleWhatsApp = () => {
    // Implement WhatsApp contact
    const message = `I'm interested in the project: ${project.title}`;
    const whatsappUrl = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Main Action Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
            {project.startingPrice && (
              <p className="text-sm text-green-600 font-medium">{project.startingPrice}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'bg-red-50 text-red-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Share Button */}
            <button
              onClick={shareProject}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Share project"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Contact Button */}
            <button
              onClick={() => setShowContactOptions(!showContactOptions)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Contact
            </button>
          </div>
        </div>

        {/* Expanded Contact Options */}
        {showContactOptions && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={handlePhoneCall}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </button>
              
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowContactOptions(false)}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
