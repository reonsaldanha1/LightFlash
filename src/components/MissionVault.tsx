/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Shield,
  HeartPulse,
  PhoneCall,
  MapPin,
  BookOpen,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Copy,
  AlertCircle,
} from 'lucide-react';
import {
  EncryptedVaultPayload,
  GPSCoordinates,
  IceContact,
  Waypoint,
} from '../types/flashlight';
import {
  encryptVault,
  decryptVault,
  saveEncryptedContainer,
  getSavedEncryptedContainer,
  hasSavedVault,
  getDefaultVaultPayload,
} from '../utils/crypto';

interface MissionVaultProps {
  gps: GPSCoordinates;
  isNightVision: boolean;
}

export const MissionVault: React.FC<MissionVaultProps> = ({ gps, isNightVision }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<EncryptedVaultPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'medical' | 'contacts' | 'waypoints' | 'survival'>('medical');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedWaypoint, setCopiedWaypoint] = useState<string | null>(null);

  const hasVault = hasSavedVault();

  // Handle Unlock / Setup
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setErrorMsg('Please enter a PIN or passphrase.');
      return;
    }

    setErrorMsg(null);

    try {
      const savedContainer = getSavedEncryptedContainer();
      if (!savedContainer) {
        // First time initializing the encrypted vault on device
        const defaultData = getDefaultVaultPayload();
        const encrypted = await encryptVault(defaultData, passphrase);
        saveEncryptedContainer(encrypted);
        setVaultData(defaultData);
        setIsUnlocked(true);
        setSaveStatus('Vault created & encrypted offline.');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        // Decrypt existing local container
        const decrypted = await decryptVault(savedContainer, passphrase);
        setVaultData(decrypted);
        setIsUnlocked(true);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Invalid passphrase or corrupt vault.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setVaultData(null);
    setPassphrase('');
    setErrorMsg(null);
  };

  // Re-encrypt and save to localStorage
  const handleSaveVault = async () => {
    if (!vaultData || !passphrase) return;

    try {
      const updatedPayload: EncryptedVaultPayload = {
        ...vaultData,
        updatedAt: new Date().toISOString(),
      };
      const encrypted = await encryptVault(updatedPayload, passphrase);
      saveEncryptedContainer(encrypted);
      setSaveStatus('Saved with AES-256-GCM encryption.');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setErrorMsg('Failed to encrypt changes.');
    }
  };

  // Add current GPS as a Waypoint
  const handleAddCurrentLocation = () => {
    if (!vaultData || gps.latitude === null || gps.longitude === null) return;

    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: `Waypoint #${vaultData.waypoints.length + 1}`,
      lat: gps.latitude,
      lng: gps.longitude,
      altitude: gps.altitude,
      accuracy: gps.accuracy,
      timestamp: Date.now(),
      notes: 'Logged via offline GPS sensor',
    };

    setVaultData({
      ...vaultData,
      waypoints: [newWp, ...vaultData.waypoints],
    });
  };

  const handleDeleteWaypoint = (id: string) => {
    if (!vaultData) return;
    setVaultData({
      ...vaultData,
      waypoints: vaultData.waypoints.filter((w) => w.id !== id),
    });
  };

  const handleAddContact = () => {
    if (!vaultData) return;
    const newContact: IceContact = {
      id: `ice-${Date.now()}`,
      name: 'New Contact',
      relationship: 'Emergency Contact',
      phone: '',
    };
    setVaultData({
      ...vaultData,
      iceContacts: [...vaultData.iceContacts, newContact],
    });
  };

  const handleDeleteContact = (id: string) => {
    if (!vaultData) return;
    setVaultData({
      ...vaultData,
      iceContacts: vaultData.iceContacts.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${isNightVision ? 'text-red-400' : 'text-amber-400'}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Mission-Critical Vault (AES-256 Encrypted)
          </h3>
        </div>

        {isUnlocked && (
          <div className="flex items-center gap-2">
            {saveStatus && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleSaveVault}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 text-xs font-mono transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={handleLock}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Lock</span>
            </button>
          </div>
        )}
      </div>

      {/* Locked Screen: PIN Entry */}
      {!isUnlocked ? (
        <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <KeyRound className={`w-6 h-6 ${isNightVision ? 'text-red-400' : 'text-amber-400'}`} />
          </div>

          <h4 className="text-sm font-bold text-slate-200">
            {hasVault ? 'Offline Encrypted Vault Locked' : 'Initialize Encrypted Survival Vault'}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {hasVault
              ? 'Enter your master PIN/passphrase to decrypt medical records, ICE contacts, and offline waypoints.'
              : 'Create a master PIN/passphrase. All mission-critical data is encrypted locally with PBKDF2 + AES-256-GCM. 100% offline.'}
          </p>

          <form onSubmit={handleUnlock} className="mt-4 max-w-xs mx-auto space-y-2">
            <input
              type="password"
              placeholder={hasVault ? 'Enter Master PIN / Passphrase' : 'Create Master PIN (e.g. 1234)'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />

            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                isNightVision
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <span>{hasVault ? 'Decrypt Vault' : 'Setup & Encrypt'}</span>
            </button>
          </form>

          <div className="mt-3 text-[10px] font-mono text-slate-500">
            Zero Server Transmission • Web Crypto API • E2EE
          </div>
        </div>
      ) : (
        /* Unlocked Content Tabs */
        <div className="space-y-3">
          {/* Vault Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('medical')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'medical'
                  ? isNightVision
                    ? 'bg-red-900/60 text-red-200 border border-red-700'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Medical</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'contacts'
                  ? isNightVision
                    ? 'bg-red-900/60 text-red-200 border border-red-700'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab('waypoints')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'waypoints'
                  ? isNightVision
                    ? 'bg-red-900/60 text-red-200 border border-red-700'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Waypoints</span>
            </button>

            <button
              onClick={() => setActiveTab('survival')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'survival'
                  ? isNightVision
                    ? 'bg-red-900/60 text-red-200 border border-red-700'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Field Guide</span>
            </button>
          </div>

          {/* TAB 1: MEDICAL ICE */}
          {activeTab === 'medical' && vaultData && (
            <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">BLOOD GROUP</label>
                  <input
                    type="text"
                    value={vaultData.medicalProfile.bloodType}
                    onChange={(e) =>
                      setVaultData({
                        ...vaultData,
                        medicalProfile: { ...vaultData.medicalProfile, bloodType: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-bold text-red-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">ORGAN DONOR</label>
                  <button
                    type="button"
                    onClick={() =>
                      setVaultData({
                        ...vaultData,
                        medicalProfile: {
                          ...vaultData.medicalProfile,
                          organDonor: !vaultData.medicalProfile.organDonor,
                        },
                      })
                    }
                    className={`w-full py-1.5 px-2.5 rounded-lg border font-mono text-center ${
                      vaultData.medicalProfile.organDonor
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {vaultData.medicalProfile.organDonor ? 'YES (DONOR)' : 'NO'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">SEVERE ALLERGIES</label>
                <input
                  type="text"
                  value={vaultData.medicalProfile.allergies}
                  onChange={(e) =>
                    setVaultData({
                      ...vaultData,
                      medicalProfile: { ...vaultData.medicalProfile, allergies: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">CRITICAL CONDITIONS & MEDS</label>
                <textarea
                  rows={2}
                  value={vaultData.medicalProfile.medicalConditions}
                  onChange={(e) =>
                    setVaultData({
                      ...vaultData,
                      medicalProfile: { ...vaultData.medicalProfile, medicalConditions: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ICE CONTACTS */}
          {activeTab === 'contacts' && vaultData && (
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-400">EMERGENCY PHONE DIRECTORY</span>
                <button
                  onClick={handleAddContact}
                  className="flex items-center gap-1 text-[10px] font-mono text-amber-400 hover:text-amber-300"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              {vaultData.iceContacts.map((contact, idx) => (
                <div key={contact.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={contact.name}
                      placeholder="Contact Name"
                      onChange={(e) => {
                        const updated = [...vaultData.iceContacts];
                        updated[idx].name = e.target.value;
                        setVaultData({ ...vaultData, iceContacts: updated });
                      }}
                      className="bg-transparent font-bold text-slate-100 focus:outline-none"
                    />
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-slate-500 hover:text-rose-400"
                      aria-label="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={contact.relationship}
                      placeholder="Relation (e.g. Spouse)"
                      onChange={(e) => {
                        const updated = [...vaultData.iceContacts];
                        updated[idx].relationship = e.target.value;
                        setVaultData({ ...vaultData, iceContacts: updated });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-400 w-1/2"
                    />
                    <div className="flex items-center gap-1 w-1/2">
                      <input
                        type="tel"
                        value={contact.phone}
                        placeholder="Phone Number"
                        onChange={(e) => {
                          const updated = [...vaultData.iceContacts];
                          updated[idx].phone = e.target.value;
                          setVaultData({ ...vaultData, iceContacts: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-200 flex-1"
                      />
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-1 rounded bg-emerald-600/30 text-emerald-400 border border-emerald-500/40"
                          title="Call immediately"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: WAYPOINTS */}
          {activeTab === 'waypoints' && vaultData && (
            <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-400">OFFLINE GPS PINS & RENDEZVOUS</span>
                <button
                  onClick={handleAddCurrentLocation}
                  disabled={gps.latitude === null}
                  className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Pin Current GPS
                </button>
              </div>

              {vaultData.waypoints.map((wp) => (
                <div key={wp.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{wp.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const text = `${wp.name}: ${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}`;
                          navigator.clipboard.writeText(text);
                          setCopiedWaypoint(wp.id);
                          setTimeout(() => setCopiedWaypoint(null), 2000);
                        }}
                        className="text-slate-400 hover:text-white"
                        title="Copy coordinates"
                      >
                        {copiedWaypoint === wp.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteWaypoint(wp.id)}
                        className="text-slate-500 hover:text-rose-400"
                        aria-label="Delete waypoint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">
                    LAT {wp.lat.toFixed(4)}° • LNG {wp.lng.toFixed(4)}° {wp.altitude ? `• Alt: ${wp.altitude}m` : ''}
                  </div>
                  {wp.notes && <div className="text-[10px] text-slate-400 italic">{wp.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SURVIVAL RADIO & FIELD GUIDE */}
          {activeTab === 'survival' && (
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Wilderness Emergency Reference Manual</span>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-300 font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-amber-400 font-bold">EMERGENCY RADIO FREQUENCIES:</div>
                  <div>• Maritime / Coastal Distress: VHF Ch 16 (156.800 MHz)</div>
                  <div>• Aviation Distress Beacon: 121.500 MHz VHF</div>
                  <div>• Wilderness Calling: 146.520 MHz 2m FM</div>
                  <div>• Citizens Band (CB) Emergency: Channel 9 (27.065 MHz)</div>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-emerald-400 font-bold">GROUND-TO-AIR SIGNALS (Make with rocks/logs):</div>
                  <div>• "V" : Require Assistance</div>
                  <div>• "X" : Require Medical Assistance</div>
                  <div>• "N" : No / Negative</div>
                  <div>• "Y" : Yes / Affirmative</div>
                  <div>• "➔" : Proceeding in this direction</div>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-rose-400 font-bold">WHISTLE & OPTICAL DISTRESS RULE OF THREE:</div>
                  <div>• 3 blasts of whistle or 3 flashes of light = DISTRESS</div>
                  <div>• Wait 1 minute, repeat continuously until acknowledged</div>
                  <div>• 2 blasts of whistle = Response / Acknowledgment</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
