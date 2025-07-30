import { useState } from 'react';

type AccountSettingsProps = {
  user: { id: number; username: string; email: string };
  onUsernameUpdate: (newUsername: string) => void;
  onLogout: () => void;
};

export default function AccountSettings({ user, onUsernameUpdate, onLogout }: AccountSettingsProps) {
  const [usernameForm, setUsernameForm] = useState({ oldUsername: user.username, newUsername: '' });
  const [passwordForm, setPasswordForm] = useState({ username: user.username, oldPassword: '', newPassword: '' });
  const [deleteForm, setDeleteForm] = useState({ username: user.username });
  const [msg, setMsg] = useState('');

  // Update username
  const handleUsernameChange = (e) => {
    setUsernameForm({ ...usernameForm, [e.target.name]: e.target.value });
  };
  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('http://localhost:3001/api/users/username', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usernameForm)
    });
    const data = await res.json();
    setMsg(data.error || data.message || 'Username updated successfully!');
    if (!data.error && usernameForm.newUsername) {
      onUsernameUpdate(usernameForm.newUsername);
      setUsernameForm({ oldUsername: usernameForm.newUsername, newUsername: '' });
      setTimeout(() => setMsg(''), 2000);
    }
  };

  // Update password
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('http://localhost:3001/api/users/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordForm)
    });
    const data = await res.json();
    setMsg(data.error || data.message || 'Password updated successfully!');
    if (!data.error) {
      onLogout();
      setTimeout(() => setMsg(''), 2000);
    }
  };

  // Delete account
  const handleDeleteChange = (e) => {
    setDeleteForm({ ...deleteForm, [e.target.name]: e.target.value });
  };
  const handleDelete = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('http://localhost:3001/api/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deleteForm)
    });
    const data = await res.json();
    setMsg(data.error || data.message || 'Account deleted successfully!');
    if (!data.error) {
      onLogout();
      setTimeout(() => setMsg(''), 2000);
    }
  };

  return (
    <div className="account-settings">
      <h2>Account Settings</h2>
      <form onSubmit={handleUsernameUpdate}>
        <h3>Change Username</h3>
        <input name="oldUsername" placeholder="Current Username" value={usernameForm.oldUsername} onChange={handleUsernameChange} required disabled />
        <input name="newUsername" placeholder="New Username" value={usernameForm.newUsername} onChange={handleUsernameChange} required />
        <button type="submit">Update Username</button>
      </form>
      <form onSubmit={handlePasswordUpdate}>
        <h3>Change Password</h3>
        <input name="username" placeholder="Username" value={passwordForm.username} onChange={handlePasswordChange} required disabled />
        <input name="oldPassword" type="password" placeholder="Current Password" value={passwordForm.oldPassword} onChange={handlePasswordChange} required />
        <input name="newPassword" type="password" placeholder="New Password" value={passwordForm.newPassword} onChange={handlePasswordChange} required />
        <button type="submit">Update Password</button>
      </form>
      <form onSubmit={handleDelete}>
        <h3>Delete Account</h3>
        <input name="username" placeholder="Username" value={deleteForm.username} onChange={handleDeleteChange} required disabled />
        <button type="submit">Delete Account</button>
      </form>
      {msg && <p className="account-msg">{msg}</p>}
    </div>
  );
}
