'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import LoginModal from './LoginModal';



interface ComplaintData {
  title: string;
  description: string;
  category: string;
  location: string;
  images: File[];  // ✅ Fixed: Explicitly type as File[]
  priority: string;
  complainerName: string;       // ✅ new
  voiceRecording?: {
    base64: string;
    type: string;
    name: string;
  } | null;   
}

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [complaintData, setComplaintData] = useState<ComplaintData>({
    title: '',
    description: '',
    category: '',
    location: '',
    images: [],  // ✅ Now properly typed as File[]
    priority: '',
    complainerName: '',
    voiceRecording: null,
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);
const [isRecording, setIsRecording] = useState(false);
const [mediaRecorderRef, setMediaRecorderRef] = useState<MediaRecorder | null>(null);
const [isLoginOpen, setIsLoginOpen] = useState(false);
const [userEmail, setUserEmail] = useState<string | null>(null);

  const categories = [
    'Water Supply', 'Electricity', 'Roads', 'Sanitation', 'Street Lights', 
    'Garbage', 'Parks', 'Public Safety', 'Others'
  ];
  

  const priorities = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

// ✅ Add loading state
const [isLoading, setIsLoading] = useState(false);


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ✅ Validation
  if (!complaintData.title.trim() || !complaintData.category || !complaintData.priority || !complaintData.complainerName ) {
    alert('❌ Please fill Complainer-Name, Title, Category, and Priority!');
    return;
  }

  setIsLoading(true);

  try {
    // ✅ Convert images to base64
    const imagePromises = complaintData.images.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            base64: e.target?.result as string,
            type: file.type,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const images = await Promise.all(imagePromises);

    const response = await fetch('/api/email-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: complaintData.title,
        category: complaintData.category,
        priority: complaintData.priority,
        location: complaintData.location,
        description: complaintData.description,
        images: images, // ✅ Send base64 images
        voiceRecording: complaintData.voiceRecording // ✅ new

      })
    });

    const result = await response.json();

    if (response.ok) {
      // ✅ SUCCESS - Reset everything
      setComplaintData({ title: '', description: '', category: '', location: '', images: [], priority: '',  complainerName: '',
      voiceRecording: null, });
      setIsModalOpen(false);
      setLocationError('');
      alert(`✅ Complaint submitted! Email with ${result.attachments || 0} photos sent to kethevara7246@gmail.com`);
    } else {
      alert(`❌ Failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('❌ Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};



// ✅ Reset form when modal closes
const handleCloseModal = () => {
  setIsModalOpen(false);
  // ✅ CLEAR ALL DATA when closing
  setComplaintData({
    title: '',
    description: '',
    category: '',
    location: '',
    images: [],
    priority: '',
    complainerName: '',
    voiceRecording: null
  });
  setLocationError('');
};


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const newImages = [...complaintData.images, ...files.slice(0, 4 - complaintData.images.length)];
    setComplaintData(prev => ({
      ...prev,
      images: newImages  // ✅ TypeScript now happy - File[] ✅
    }));
  };

  // ✅ Add type to onChange handlers
  const handleInputChange = (field: keyof ComplaintData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setComplaintData(prev => ({ ...prev, [field]: e.target.value }));
    };


    // ✅ Add these states at the top with your other useState
const [isLoadingLocation, setIsLoadingLocation] = useState(false);
const [locationError, setLocationError] = useState('');

// ✅ Geolocation handler function
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    setLocationError('Geolocation is not supported by this browser.');
    return;
  }

  setIsLoadingLocation(true);
  setLocationError('');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get readable address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          const address = data.display_name || 
                         data.address?.road || 
                         data.address?.village || 
                         `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          setComplaintData(prev => ({
            ...prev,
            location: address
          }));
          setIsLoadingLocation(false);
        })
        .catch(() => {
          // Fallback to coordinates if reverse geocoding fails
          setComplaintData(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          setIsLoadingLocation(false);
        });
    },
    (error) => {
      setIsLoadingLocation(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setLocationError('Location access denied. Please allow location access.');
          break;
        case error.POSITION_UNAVAILABLE:
          setLocationError('Location information is unavailable.');
          break;
        case error.TIMEOUT:
          setLocationError('Location request timed out.');
          break;
        default:
          setLocationError('An unknown error occurred.');
          break;
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
};

  return (
    
    <main className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-6 pt-6 pb-24">
          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 border border-white/20">
                <Image
                  src="/villagelogo.png"
                  alt="Village & Panchayat"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-100 uppercase tracking-wide">
                  Gram-Sevak
                </p>
                <p className="text-xs text-blue-200">
                  Village & Panchayat Portal
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {userEmail ? (
                <>
                  <span className="text-sm text-blue-100 hidden sm:inline">
                    {userEmail}
                  </span>
                  <button
                    onClick={() => {
                      setUserEmail(null);
                      if (typeof window !== 'undefined') {
                        window.location.reload();
                      }
                    }}
                    className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                      🔒
                    </span>
                    <span>Logout</span>
                  </button>

                </>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg白/20 transition"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a7.5 7.5 0 0115 0" />
                    </svg>
                  </span>
                  <span>Login</span>
                </button>
              )}
            </div>

            <LoginModal
              isOpen={isLoginOpen}
              onClose={() => setIsLoginOpen(false)}
              onSuccess={(email) => setUserEmail(email)}
            />


          </div>

          {/* HERO CONTENT */}
          <div className="text-center">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black leading-tight transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              Empowering Citizens with
              <br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Digital Complaint Services
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Report issues instantly. Track complaint status. Stay connected with your locality.
              <span className="block font-semibold text-yellow-200 mt-2">
                A smart solution for modern governance.
              </span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative px-8 py-4 bg-white text-blue-700 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transform transition-all duration-300 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">🚀 Raise a Complaint</span>
              </button>
              <a href="#features" className="px-8 py-4 border-2 border-white/50 text-white text-lg font-semibold rounded-2xl hover:bg-white/10 hover:border-white transition-all duration-300 flex items-center gap-2">
                📖 Learn More
              </a>
            </div>
          </div>

          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </section>

      {/* ✅ COMPLAINT MODAL - TypeScript Fixed */}
{/* ✅ COMPLAINT MODAL */}
{isModalOpen && (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Raise Complaint</h2>
              <p className="text-blue-100">Report issues in your area</p>
            </div>
            <button
              onClick={handleCloseModal} // ✅ Custom close handler
              className="p-2 rounded-xl hover:bg-white/20 transition"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-px bg-white/30 my-4" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto rounded-3xl">
          {/* ✅ TITLE - REQUIRED */}
          <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Complainer Name <span className="text-red-500 text-xs">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Ramesh Kumar"
            value={complaintData.complainerName}
            onChange={handleInputChange('complainerName')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-lg"
          />
        </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              Complaint Title <span className="text-red-500 text-xs">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Broken street light near school"
              value={complaintData.title}
              onChange={handleInputChange('title')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-lg"
            />
          </div>

          {/* ✅ CATEGORY & PRIORITY - REQUIRED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                Category <span className="text-red-500 text-xs">*</span>
              </label>
              <select
                required
                value={complaintData.category}
                onChange={handleInputChange('category')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-lg"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                Priority <span className="text-red-500 text-xs">*</span>
              </label>
              <select
                required
                value={complaintData.priority}
                onChange={handleInputChange('priority')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-lg"
              >
                <option value="selectoption">Select priority</option>
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location (rest remains same) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g., Main Road, Village XYZ"
                value={complaintData.location}
                onChange={handleInputChange('location')}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation || isLoading}
                className={`px-6 py-3 font-semibold rounded-xl flex items-center gap-2 transition-all duration-200 ${
                  isLoadingLocation || isLoading
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 shadow-md'
                }`}
              >
                {isLoadingLocation ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>📍 Current</>
                )}
              </button>
            </div>
            {locationError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {locationError}
              </p>
            )}
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Describe the issue in detail..."
              value={complaintData.description}
              onChange={handleInputChange('description')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-vertical text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Voice Complaint (optional)
            </label>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (!isRecording) {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      const mr = new MediaRecorder(stream);
                      const chunks: BlobPart[] = [];

                      mr.ondataavailable = (e) => {
                        if (e.data.size > 0) chunks.push(e.data);
                      };

                      mr.onstop = () => {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          setComplaintData(prev => ({
                            ...prev,
                            voiceRecording: {
                              base64,
                              type: blob.type,
                              name: `voice-complaint-${Date.now()}.webm`,
                            },
                          }));
                        };
                        reader.readAsDataURL(blob);
                        stream.getTracks().forEach(t => t.stop());
                      };

                      mr.start();
                      setMediaRecorderRef(mr);
                      setIsRecording(true);
                    } else {
                      mediaRecorderRef?.stop();
                      setIsRecording(false);
                    }
                  } catch (err) {
                    alert('Unable to access microphone. Please allow mic permission.');
                    console.error(err);
                  }
                }}
                className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isRecording ? '⏹ Stop Recording' : '🎙 Start Recording'}
              </button>

              {complaintData.voiceRecording && !isRecording && (
                <audio
                  src={complaintData.voiceRecording.base64}
                  controls
                  className="flex-1"
                />
              )}
            </div>

            {complaintData.voiceRecording && (
              <p className="mt-2 text-sm text-gray-600">
                Attached voice note: {complaintData.voiceRecording.name}
              </p>
            )}
          </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Photos (Optional, max 4)</label>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="flex-1 min-w-[200px] h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-blue-600">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Add Photos</span>
                      <span className="text-xs">PNG, JPG up to 5MB</span>
                    </label>
                    
                    {/* Preview uploaded images */}
                    {complaintData.images.map((img, idx) => (
                      <div key={idx} className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                        <img src={URL.createObjectURL(img)} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setComplaintData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }))}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {complaintData.images.length >= 4 && (
                    <p className="text-sm text-orange-600 mt-2">Maximum 4 images allowed</p>
                  )}
                </div>
          {/* ✅ SUBMIT BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-6 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <span>🚀 Submit Complaint</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}



      {/* Rest of your component remains exactly the same... */}
      {/* FEATURES SECTION */}
      <section id="features" className="py-32 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Features Designed for Everyone
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, powerful tools that make governance accessible to all
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group relative bg-gradient-to-br from-white to-blue-50 p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 border border-blue-100/50 backdrop-blur-sm">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 rounded-3xl blur transition-opacity duration-500" />
              <div className="relative text-blue-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📨</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Easy Complaint Submission</h3>
              <p className="text-lg text-gray-600 leading-relaxed relative z-10">
                Submit issues in seconds with text, images, voice notes, and location pinning.
              </p>
            </div>

            <div className="group relative bg-gradient-to-br from-white to-green-50 p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 border border-green-100/50 backdrop-blur-sm">
              <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-10 rounded-3xl blur transition-opacity duration-500" />
              <div className="relative text-green-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Location-Based Routing</h3>
              <p className="text-lg text-gray-600 leading-relaxed relative z-10">
                Smart AI automatically forwards complaints to the right local officials instantly.
              </p>
            </div>

            <div className="group relative bg-gradient-to-br from-white to-purple-50 p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 border border-purple-100/50 backdrop-blur-sm">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-violet-600 opacity-0 group-hover:opacity-10 rounded-3xl blur transition-opacity duration-500" />
              <div className="relative text-purple-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">Real-Time Tracking</h3>
              <p className="text-lg text-gray-600 leading-relaxed relative z-10">
                Get instant notifications and live updates on your complaint status 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>
{/* FOOTER */} <footer className="bg-gray-900 text-gray-400 py-10"> <div className="max-w-7xl mx-auto px-6 text-center"> <p>© {new Date().getFullYear()} Gram-Sevak. All rights reserved.</p> </div> </footer>
      {/* Continue with About, CTA, and Footer sections as before */}
    </main>
  );
}
