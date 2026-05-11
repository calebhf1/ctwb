import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import FreeMode from './pages/FreeMode';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/leaderboard/:gameId" element={<Leaderboard />} />
        <Route path="/free" element={<FreeMode />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;