'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Mail, Send, Heart, Share2 } from 'lucide-react';
import type { ProjectInquiryCardProps } from '@/lib/projects/project-types';

export default function ProjectInquiryCard({ project }: ProjectInquiryCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [contactMethod, setContactMethod] = useState<'phone' | 'email' | 'whatsapp'>('phone');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form or show success message
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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

  return (
    <div className="bg-white rounded-lg border p-6 sticky top-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact About This Project</h3>
      
      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={toggleFavorite}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            isFavorite 
              ? 'bg-red-50 border-red-200 text-red-600' 
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          <span className="text-sm">{isFavorite ? 'Saved' : 'Save'}</span>
        </button>
        
        <button
          onClick={shareProject}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </button>
      </div>

      {/* Contact Method Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setContactMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            contactMethod === 'phone'
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span className="text-sm">Call</span>
        </button>
        
        <button
          onClick={() => setContactMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            contactMethod === 'email'
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm">Email</span>
        </button>
        
        <button
          onClick={() => setContactMethod('whatsapp')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            contactMethod === 'whatsapp'
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">WhatsApp</span>
        </button>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
        
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Your Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
        
        <div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Your Phone Number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
        
        <div>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="I'm interested in this project..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>
        
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Send className="w-4 h-4" />
          Send Inquiry
        </button>
      </form>

      {/* Project Reference */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">Project Reference:</p>
        <p className="font-mono text-sm text-gray-900">{project.referenceCode}</p>
      </div>
    </div>
  );
}
