import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.bot === 'running' ? 'Bot is running 🟢' : 'Bot is stopped 🔴'))
      .catch(() => setStatus('Error connecting to server 🔴'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Clan Game Bot</h1>
        <p className="text-lg text-slate-300 mb-8">
          The Telegram bot is currently managing the clan game.
        </p>
        <div className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 rounded-full text-lg font-medium">
          {status}
        </div>
        <div className="mt-8 text-sm text-slate-400">
          <p>Open Telegram and search for your bot to start playing!</p>
        </div>
      </div>
    </div>
  );
}
