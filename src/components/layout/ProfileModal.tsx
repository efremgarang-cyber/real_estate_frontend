import React from 'react';

interface ProfileModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  userInitials?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 shadow-lg w-full max-w-sm">
        <h3 className="text-lg font-bold">Profile</h3>
        <p className="text-sm text-gray-600 mt-2">Placeholder profile modal.</p>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;