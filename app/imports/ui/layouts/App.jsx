import React from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Roles } from 'meteor/alanning:roles';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Landing from '../pages/Landing';
import AboutUs from '../pages/AboutUs';
import AddPost from '../pages/AddPost';
import NotFound from '../pages/NotFound';
import SignUp from '../pages/SignUp';
import SignOut from '../pages/SignOut';
import NavBar from '../components/NavBar';
import SignIn from '../pages/SignIn';
import NotAuthorized from '../pages/NotAuthorized';
import LoadingSpinner from '../components/LoadingSpinner';
import Resources from '../pages/Resources';
import ResourcesAdmin from '../pages/ResourcesAdmin';
import Posts from '../pages/Posts';
import EditProfile from '../pages/EditProfile';
import Logo from '../components/Logo';
import Login from '../components/Login';
import PostsAdmin from '../pages/PostsAdmin';
import ListProfile from '../pages/ListProfile';
import AddResource from '../pages/AddResource';
import EditPost from '../pages/EditPost';
import EditPostAdmin from '../pages/EditPostAdmin';
import ViewProfile from '../pages/ViewProfile';
import ListProfileAdmin from '../pages/ListProfileAdmin';
import EditProfileAdmin from '../pages/EditProfileAdmin';

/** Top-level layout component for this application. Called in imports/startup/client/startup.jsx. */
const App = () => {
  const { ready } = useTracker(() => {
    const rdy = Roles.subscription.ready();
    return {
      ready: rdy,
    };
  });
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Login />
        <Logo />
        <NavBar />
        <Routes>
          <Route exact path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signout" element={<SignOut />} />
          <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/edit-profile-admin" element={<AdminProtectedRoute ready={ready}><EditProfileAdmin /></AdminProtectedRoute>} />
          <Route path="/list-profile" element={<ProtectedRoute><ListProfile /></ProtectedRoute>} />
          <Route path="/list-profile-admin" element={<AdminProtectedRoute ready={ready}><ListProfileAdmin /></AdminProtectedRoute>} />
          <Route path="/view-profile/:_id" element={<ProtectedRoute><ViewProfile /></ProtectedRoute>} />
          <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
          <Route path="/postsadmin" element={<AdminProtectedRoute ready={ready}><PostsAdmin /></AdminProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/resourcesadmin" element={<AdminProtectedRoute ready={ready}><ResourcesAdmin /></AdminProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddPost /></ProtectedRoute>} />
          <Route path="/addresource" element={<ProtectedRoute><AddResource /></ProtectedRoute>} />
          <Route path="/edit/:_id" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
          <Route path="/admin/edit/:_id" element={<ProtectedRoute><EditPostAdmin /></ProtectedRoute>} />
          <Route path="/notauthorized" element={<NotAuthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

/*
 * ProtectedRoute (see React Router v6 sample)
 * Checks for Meteor login before routing to the requested page, otherwise goes to signin page.
 * @param {any} { component: Component, ...rest }
 */
const ProtectedRoute = ({ children }) => {
  const isLogged = Meteor.userId() !== null;
  return isLogged ? children : <Navigate to="/signin" />;
};

/**
 * AdminProtectedRoute (see React Router v6 sample)
 * Checks for Meteor login and admin role before routing to the requested page, otherwise goes to signin page.
 * @param {any} { component: Component, ...rest }
 */
const AdminProtectedRoute = ({ ready, children }) => {
  const isLogged = Meteor.userId() !== null;
  if (!isLogged) {
    return <Navigate to="/signin" />;
  }
  if (!ready) {
    return <LoadingSpinner />;
  }
  const isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin');
  return (isLogged && isAdmin) ? children : <Navigate to="/notauthorized" />;
};

// Require a component and location to be passed to each ProtectedRoute.
ProtectedRoute.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};

ProtectedRoute.defaultProps = {
  children: <Landing />,
};

// Require a component and location to be passed to each AdminProtectedRoute.
AdminProtectedRoute.propTypes = {
  ready: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};

AdminProtectedRoute.defaultProps = {
  ready: false,
  children: <Landing />,
};

export default App;
