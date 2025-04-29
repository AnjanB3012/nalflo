import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Main from './pages/Main';
import SetupInstance from './pages/setupInstance';
import Login from './pages/login';
import Home from './pages/home';
import IAM from './pages/iam';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/setup" element={<SetupInstance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/iam" element={<IAM />} />
      </Routes>
    </Router>
  );
}

export default App;