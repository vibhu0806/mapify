import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api.js';
import { ArrowRight, Loader2 } from 'lucide-react';

export const PnrEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [pnrInput, setPnrInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  // Check if visitor already has an active, valid session on mount
  useEffect(() => {
    const existingToken = api.getPnrToken();
    if (existingToken) {
      api.verifyPnrSession(existingToken).then((isValid) => {
        if (isValid) {
          setHasExistingSession(true);
        } else {
          api.clearPnrToken();
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPnr = pnrInput.trim();
    const cleanLastName = lastNameInput.trim();
    if (!cleanPnr || !cleanLastName) {
      setErrorMessage('Please enter both your PNR number and passenger last name.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.validatePnr(cleanPnr, cleanLastName);
      if (response.valid && response.pnrToken) {
        navigate('/track');
      } else {
        setErrorMessage('Invalid PNR or Passenger Last Name. Please verify your booking details.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setErrorMessage(err.message || 'Too many attempts. Please wait a moment and try again.');
      } else {
        setErrorMessage('Invalid PNR or Passenger Last Name. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResumeExistingSession = () => {
    navigate('/track');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0A0A0A] text-[#F5F5F5] flex flex-col justify-between p-6 sm:p-10 select-none font-sans antialiased">
      {/* Top Header / Wordmark */}
      <header className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5 group">
          <div className="w-2 h-2 rounded-full bg-[#10B981] group-hover:scale-125 transition-transform" />
          <span className="font-mono text-xs tracking-widest text-[#F5F5F5] uppercase font-bold">
            ABHIBUS TELEMETRY
          </span>
        </div>

        <div className="text-[10px] font-mono tracking-widest text-[#666666] uppercase">
          SECURE PASSENGER ACCESS
        </div>
      </header>

      {/* Main Centered Minimal Form */}
      <main className="w-full max-w-md mx-auto my-auto flex flex-col items-center">
        <div className="w-full">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F5] mb-2 font-sans">
              Track your journey
            </h1>
            <p className="text-xs text-[#858585] tracking-wide font-sans">
              Live GPS bus tracking and real-time arrival updates
            </p>
          </div>

          {/* Existing Verified Session Resume Prompt */}
          {hasExistingSession && (
            <div className="mb-6 p-4 rounded-md bg-[#121212] border border-[#222222] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider font-semibold">
                  ACTIVE GPS SESSION FOUND
                </div>
                <div className="text-xs text-[#858585] mt-0.5">
                  Resume live vehicle monitoring
                </div>
              </div>
              <button
                type="button"
                onClick={handleResumeExistingSession}
                className="px-3 py-1.5 rounded bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-xs font-mono text-[#F5F5F5] flex items-center gap-1 transition-colors"
              >
                <span>RESUME</span>
                <ArrowRight className="w-3 h-3 text-[#10B981]" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* PNR Input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pnr-input"
                className="text-[11px] font-mono tracking-widest text-[#858585] uppercase"
              >
                PNR NUMBER
              </label>

              <input
                id="pnr-input"
                type="text"
                autoComplete="off"
                spellCheck="false"
                placeholder="Enter PNR number"
                value={pnrInput}
                onChange={(e) => {
                  setPnrInput(e.target.value.toUpperCase());
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full h-12 px-4 rounded bg-[#121212] border border-[#242424] focus:border-[#555555] focus:outline-none font-mono text-sm tracking-wider text-[#F5F5F5] placeholder:text-[#383838] transition-colors"
              />
            </div>

            {/* Passenger Last Name Input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lastname-input"
                className="text-[11px] font-mono tracking-widest text-[#858585] uppercase"
              >
                PASSENGER LAST NAME
              </label>

              <input
                id="lastname-input"
                type="text"
                autoComplete="family-name"
                spellCheck="false"
                placeholder="Enter passenger last name"
                value={lastNameInput}
                onChange={(e) => {
                  setLastNameInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full h-12 px-4 rounded bg-[#121212] border border-[#242424] focus:border-[#555555] focus:outline-none font-sans text-sm text-[#F5F5F5] placeholder:text-[#383838] transition-colors"
              />
            </div>

            {/* Discreet Error Message */}
            {errorMessage && (
              <div className="text-xs text-[#EF4444] font-sans py-1 transition-opacity duration-200">
                {errorMessage}
              </div>
            )}

            {/* Track Journey Submit Button */}
            <button
              type="submit"
              disabled={loading || !pnrInput.trim() || !lastNameInput.trim()}
              className="w-full h-12 mt-2 rounded bg-[#333333] hover:bg-[#3D3D3D] text-[#F5F5F5] font-medium text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#F5F5F5]" />
                  <span>LOCATING VEHICLE...</span>
                </>
              ) : (
                <span>TRACK JOURNEY</span>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex items-center justify-between text-[11px] font-mono text-[#555555]">
        <div>REAL-TIME FLEET NETWORK</div>
        <div>SECURE ACCESS</div>
      </footer>
    </div>
  );
};
