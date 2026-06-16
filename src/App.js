import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import CityLeaderboard from './pages/CityLeaderboard';
import FreeMode from './pages/FreeMode';
import PassAndPlay from './pages/PassAndPlay';
import DailyChallenge from './pages/DailyChallenge';

function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/leaderboard/:gameId" element={<Leaderboard />} />
        <Route path="/city-leaderboard/:city" element={<CityLeaderboard />} />
        <Route path="/free" element={<FreeMode />} />
        <Route path="/pass-and-play" element={<PassAndPlay />} />
        <Route path="/daily" element={<DailyChallenge />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;