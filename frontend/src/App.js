import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Main from './pages/Main';
import SetupInstance from './pages/setupInstance';
import Login from './pages/login';
import Home from './pages/home';
import IAM from './pages/iam';
import CreateNewUser from './pages/createNewUser';
import ViewUser from './pages/viewUser';
import CreateNewRole from './pages/createNewRole';
import ViewRole from './pages/viewRole';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/setup" element={<SetupInstance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/iam" element={<IAM />} />
        <Route path="/createNewUser" element={<CreateNewUser />} />
        <Route path="/viewUser/:userName" element={<ViewUser />} />
        <Route path="/createNewRole" element={<CreateNewRole />} />
        <Route path="/viewRole/:roleTitle" element={<ViewRole />} />
      </Routes>
    </Router>
  );
}

export default App;